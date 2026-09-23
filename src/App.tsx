import React, { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  IslandState,
  ActionCardType,
  ChatMessage,
  ToolExecutionState,
  ToolApprovalRequest,
  GmailDraftIntent,
  CalendarEventIntent,
} from './types/island';
import { SlashCommand, SessionRecord } from './types/commands';
import { sessionStorageService } from './services/session/sessionStorageService';
import { NotchContainer } from './components/NotchContainer';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';
import { ReActEngine } from './services/agent/reactEngine';

interface NotchNotification {
  text: string;
  type?: 'info' | 'success' | 'warning';
}

export const App: React.FC = () => {
  // Query parameters for initial state support
  const queryParams = new URLSearchParams(window.location.search);
  const initialUrlState = (queryParams.get('state') as IslandState) || 'idle';
  const initialUrlIntent = (queryParams.get('intent') as ActionCardType) || 'chat';

  // Session & History State
  const initialActiveSession = sessionStorageService.getActiveSession();
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    sessionStorageService.getAllSessions()
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    sessionStorageService.getActiveSessionId()
  );

  const [state, setState] = useState<IslandState>(initialUrlState);
  const [intentType, setIntentType] = useState<ActionCardType>(initialUrlIntent);
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialActiveSession ? initialActiveSession.messages : []
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolExecutionState | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<ToolApprovalRequest | null>(null);
  const [gmailIntent, setGmailIntent] = useState<GmailDraftIntent | null>(null);
  const [calendarIntent, setCalendarIntent] = useState<CalendarEventIntent | null>(null);
  const [notification, setNotification] = useState<NotchNotification | null>(null);
  const [activeModel, setActiveModel] = useState<{ id: string; name: string }>({
    id: 'antigravity',
    name: 'Antigravity Core',
  });

  const stateRef = useRef<IslandState>(state);
  stateRef.current = state;
  const lastToggleTime = useRef(0);
  const notchInputRef = useRef<HTMLTextAreaElement | null>(null);
  const reactEngineRef = useRef<ReActEngine>(new ReActEngine());
  const approvalResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize messages to local session persistence
  useEffect(() => {
    if (activeSessionId) {
      sessionStorageService.saveSessionMessages(activeSessionId, messages);
      setSessions(sessionStorageService.getAllSessions());
    }
  }, [messages, activeSessionId]);

  const showNotification = useCallback(
    (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      setNotification({ text, type });
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, 2600);
    },
    []
  );

  // Sync keyboard interactivity with OS Layer Shell / KWin
  const syncKeyboardInteractivity = useCallback((active: boolean) => {
    try {
      invoke('set_keyboard_interactivity', { interactive: active }).catch(() => {});
    } catch {
      // Ignored in standard browser preview
    }
  }, []);

  const showOverlay = useCallback(async () => {
    try {
      await invoke('show_window');
    } catch {
      // Ignored outside Tauri
    }
  }, []);

  const hideOverlay = useCallback(async () => {
    try {
      await invoke('hide_window');
    } catch {
      // Ignored outside Tauri
    }
  }, []);

  useEffect(() => {
    const isInteractive = state !== 'hidden';
    syncKeyboardInteractivity(isInteractive);

    if (isInteractive) {
      window.focus();
      const timer = setTimeout(() => {
        window.focus();
        notchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    } else {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [state, syncKeyboardInteractivity]);

  // Hotkey toggle (Ctrl + Alt) - Instantaneous state trigger (0ms latency)
  const handleToggle = useCallback(async () => {
    const now = Date.now();
    if (now - lastToggleTime.current < 150) {
      return;
    }
    lastToggleTime.current = now;

    const current = stateRef.current;
    if (current === 'hidden') {
      await showOverlay();
      setState('idle');
      setTimeout(() => {
        notchInputRef.current?.focus();
      }, 50);
    } else {
      syncKeyboardInteractivity(false);
      setState('hidden');
    }
  }, [showOverlay, syncKeyboardInteractivity]);

  // Click on the Notch top bar
  const handleNotchClick = useCallback(() => {
    const current = stateRef.current;
    if (current === 'idle' || current === 'typing' || current === 'listening') {
      setState('action');
    } else if (current === 'action') {
      setState('idle');
      setTimeout(() => {
        notchInputRef.current?.focus();
      }, 50);
    } else if (current === 'success') {
      setState('idle');
    }
  }, []);

  // Dismissal when clicking outside while expanded: retracts to notch
  const handleBackdropClick = useCallback(() => {
    const current = stateRef.current;
    if (
      current === 'action' ||
      current === 'listening' ||
      current === 'success' ||
      current === 'typing'
    ) {
      setState('idle');
      setTimeout(() => {
        notchInputRef.current?.focus();
      }, 50);
    }
  }, []);

  // Action completion
  const handleActionComplete = useCallback(() => {
    setState('success');
    setIntentType('chat');
    setGmailIntent(null);
    setCalendarIntent(null);
  }, []);

  // Tool Approval Handlers
  const handleApproveTool = useCallback((_id: string) => {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(true);
      approvalResolverRef.current = null;
    }
    setApprovalRequest(null);
  }, []);

  const handleDenyTool = useCallback((_id: string) => {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(false);
      approvalResolverRef.current = null;
    }
    setApprovalRequest(null);
  }, []);

  // Clear active conversation messages
  const handleClearSession = useCallback(() => {
    setMessages([]);
    setUserPrompt('');
    setIsStreaming(false);
    setIsThinking(false);
    setActiveTool(null);
    setApprovalRequest(null);
    setGmailIntent(null);
    setCalendarIntent(null);
    setIntentType('chat');
    if (activeSessionId) {
      sessionStorageService.saveSessionMessages(activeSessionId, []);
      setSessions(sessionStorageService.getAllSessions());
    }
    showNotification('Canvas cleared', 'info');
    setTimeout(() => {
      notchInputRef.current?.focus();
    }, 50);
  }, [activeSessionId, showNotification]);

  // Start fresh conversation session
  const handleStartNewSession = useCallback(() => {
    const newSession = sessionStorageService.createNewSession('New Conversation');
    setActiveSessionId(newSession.id);
    setSessions(sessionStorageService.getAllSessions());
    setMessages([]);
    setUserPrompt('');
    setIsStreaming(false);
    setIsThinking(false);
    setActiveTool(null);
    setApprovalRequest(null);
    setGmailIntent(null);
    setCalendarIntent(null);
    setIntentType('chat');
    showNotification('New session initialized', 'success');
    setTimeout(() => {
      notchInputRef.current?.focus();
    }, 50);
  }, [showNotification]);

  // Open history drawer
  const handleOpenHistory = useCallback(() => {
    setSessions(sessionStorageService.getAllSessions());
    setIntentType('history');
    setState('action');
  }, []);

  // Select a session from history
  const handleSelectSession = useCallback(
    (session: SessionRecord) => {
      sessionStorageService.setActiveSessionId(session.id);
      setActiveSessionId(session.id);
      setMessages(session.messages || []);
      setIntentType('chat');
      setState('action');
      showNotification(`Loaded "${session.title}"`, 'info');
      setTimeout(() => {
        notchInputRef.current?.focus();
      }, 50);
    },
    [showNotification]
  );

  // Delete a session from history
  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      sessionStorageService.deleteSession(sessionId);
      const remaining = sessionStorageService.getAllSessions();
      setSessions(remaining);
      const newActiveId = sessionStorageService.getActiveSessionId();
      setActiveSessionId(newActiveId);
      const activeSess = sessionStorageService.getSession(newActiveId);
      setMessages(activeSess?.messages || []);
      showNotification('Session deleted', 'info');
    },
    [showNotification]
  );

  // Close history and return to active chat
  const handleCloseHistory = useCallback(() => {
    setIntentType('chat');
    setTimeout(() => {
      notchInputRef.current?.focus();
    }, 50);
  }, []);

  // When prompt is submitted via Enter key:
  const handlePromptSubmit = useCallback(
    async (promptText: string) => {
      const trimmed = promptText.trim();
      if (!trimmed) return;

      setUserPrompt('');

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content: trimmed,
      };
      const assistantMsgId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const assistantPlaceholder: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIntentType('chat');
      setState('action');
      setIsStreaming(true);

      // Persist user prompt to SQLite
      try {
        await invoke('save_session_message', {
          id: userMsg.id,
          sessionId: activeSessionId || 'default-session',
          role: 'user',
          content: trimmed,
          toolCalls: null,
          toolCallId: null,
        });
      } catch {
        // Non-blocking in browser preview
      }

      setTimeout(() => {
        notchInputRef.current?.focus();
      }, 50);

      // Run Full ReAct Loop Orchestrator
      reactEngineRef.current.runConversationTurn(
        trimmed,
        messages,
        {
          onThinkingChange: (thinking) => {
            setIsThinking(thinking);
          },
          onToolStateChange: (tool) => {
            setActiveTool(tool);
          },
          onApprovalRequired: async (request) => {
            return new Promise<boolean>((resolve) => {
              setApprovalRequest(request);
              approvalResolverRef.current = resolve;
            });
          },
          onActionCardIntent: (intent) => {
            if (intent.type === 'gmail') {
              setGmailIntent(intent as GmailDraftIntent);
              setIntentType('gmail');
            } else if (intent.type === 'calendar') {
              setCalendarIntent(intent as CalendarEventIntent);
              setIntentType('calendar');
            }
          },
          onStreamChunk: (_msgId, token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholder.id ? { ...m, content: token } : m
              )
            );
          },
          onDone: () => {
            setIsStreaming(false);
            setIsThinking(false);
            setActiveTool(null);
          },
          onError: (err) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholder.id ? { ...m, content: `Error: ${err}` } : m
              )
            );
            setIsStreaming(false);
            setIsThinking(false);
            setActiveTool(null);
          },
        },
        activeModel.id
      );
    },
    [messages, activeSessionId, activeModel.id]
  );

  // Command Execution Handler
  const handleExecuteCommand = useCallback(
    (cmd: SlashCommand) => {
      cmd.execute({
        startNewSession: handleStartNewSession,
        openHistory: handleOpenHistory,
        clearMessages: handleClearSession,
        compactContext: () => {
          if (messages.length === 0) {
            showNotification('No messages to compact', 'warning');
            return;
          }
          const summaryMsg: ChatMessage = {
            id: `compact-${Date.now()}`,
            role: 'system',
            content: `[Context Compressed: ${messages.length} previous messages summarized]`,
          };
          setMessages([summaryMsg]);
          showNotification('Context memory compressed', 'success');
        },
        switchModel: (modelId, modelName) => {
          setActiveModel({ id: modelId, name: modelName });
          showNotification(`Active model set to ${modelName}`, 'success');
        },
        injectPrompt: (prompt, autoSubmit) => {
          setUserPrompt(prompt);
          if (autoSubmit) {
            handlePromptSubmit(prompt);
          } else {
            if (stateRef.current === 'idle') {
              setState('typing');
            }
            setTimeout(() => {
              notchInputRef.current?.focus();
            }, 50);
          }
        },
        setSystemPromptOverride: (_p) => {},
        closePalette: () => {
          setUserPrompt('');
        },
        showNotification,
      });
    },
    [
      handleStartNewSession,
      handleOpenHistory,
      handleClearSession,
      messages,
      showNotification,
      handlePromptSubmit,
    ]
  );

  // When user types in prompt:
  const handlePromptChange = useCallback((text: string) => {
    setUserPrompt(text);
    if (text.startsWith('/')) {
      setState('action');
    } else if (stateRef.current === 'idle' && text.length > 0) {
      setState('typing');
    } else if (stateRef.current === 'typing' && text.length === 0) {
      setState('idle');
    }
  }, []);

  // When success toast duration finishes:
  const handleSuccessDismiss = useCallback(() => {
    setUserPrompt('');
    setState('idle');
    setTimeout(() => {
      notchInputRef.current?.focus();
    }, 50);
  }, []);

  const handleAnimationEnd = useCallback(async () => {
    if (stateRef.current === 'hidden') {
      await hideOverlay();
    }
  }, [hideOverlay]);

  // Global shortcut hook for Ctrl + Alt
  useGlobalShortcut({
    onToggle: handleToggle,
  });

  // Direct Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Space: Toggle between expanded action card and idle notch
      if (e.ctrlKey && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => (prev === 'action' ? 'idle' : 'action'));
        if (stateRef.current === 'action') {
          setTimeout(() => {
            notchInputRef.current?.focus();
          }, 50);
        }
        return;
      }

      // Ctrl + N: Quick New Session
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleStartNewSession();
        return;
      }

      // Ctrl + H: Quick History
      if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleOpenHistory();
        return;
      }

      // Escape: Close history drawer or dismiss slash palette
      if (e.key === 'Escape') {
        if (intentType === 'history') {
          e.preventDefault();
          handleCloseHistory();
          return;
        }
        if (userPrompt.startsWith('/')) {
          e.preventDefault();
          setUserPrompt('');
          if (messages.length === 0) {
            setState('idle');
          }
          return;
        }
      }

      const target = e.target as HTMLElement | null;
      const isTypingInNotch = target === notchInputRef.current;
      const isOtherFormInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable) &&
        !isTypingInNotch;

      if (isOtherFormInput) {
        return;
      }

      // Allow all regular typing in notch
      if (isTypingInNotch) {
        return;
      }

      // If nothing is focused but user pressed a regular character key in idle mode:
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        (stateRef.current === 'idle' || stateRef.current === 'typing')
      ) {
        notchInputRef.current?.focus();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [
    handleStartNewSession,
    handleOpenHistory,
    handleCloseHistory,
    intentType,
  ]);

  const isExpanded = state === 'action' || state === 'listening';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none font-sans">
      {/* Backdrop overlay active only when dropdown card is expanded to retract back to notch on click */}
      {isExpanded && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-transparent z-30 cursor-default"
        />
      )}

      {/* The Monolithic Floating Mavis Notch (Unified Obsidian Canvas) */}
      <NotchContainer
        state={state}
        intentType={intentType}
        gmailIntent={gmailIntent}
        calendarIntent={calendarIntent}
        userPrompt={userPrompt}
        messages={messages}
        isStreaming={isStreaming}
        isThinking={isThinking}
        activeTool={activeTool}
        approvalRequest={approvalRequest}
        notification={notification}
        sessions={sessions}
        activeSessionId={activeSessionId}
        inputRef={notchInputRef}
        onApproveTool={handleApproveTool}
        onDenyTool={handleDenyTool}
        onPromptChange={handlePromptChange}
        onPromptSubmit={handlePromptSubmit}
        onExecuteCommand={handleExecuteCommand}
        onSelectSession={handleSelectSession}
        onNewSession={handleStartNewSession}
        onDeleteSession={handleDeleteSession}
        onCloseHistory={handleCloseHistory}
        onClearSession={handleClearSession}
        onNotchClick={handleNotchClick}
        onActionComplete={handleActionComplete}
        onSuccessDismiss={handleSuccessDismiss}
        onAnimationEnd={handleAnimationEnd}
      />
    </div>
  );
};

export default App;
