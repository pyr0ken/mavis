import React, { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { IslandState, ActionCardType, ChatMessage } from './types/island';
import { NotchContainer } from './components/NotchContainer';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';

interface ChatTokenEvent {
  message_id: string;
  token: string;
  is_done: boolean;
  error?: string;
}

export const App: React.FC = () => {
  // Query parameters for initial state support
  const queryParams = new URLSearchParams(window.location.search);
  const initialUrlState = (queryParams.get('state') as IslandState) || 'idle';
  const initialUrlIntent = (queryParams.get('intent') as ActionCardType) || 'chat';

  const [state, setState] = useState<IslandState>(initialUrlState);
  const [intentType, setIntentType] = useState<ActionCardType>(initialUrlIntent);
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  
  const stateRef = useRef<IslandState>(state);
  stateRef.current = state;
  const lastToggleTime = useRef(0);
  const notchInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Listen to native Rust token stream events from Tauri backend
  useEffect(() => {
    let isCancelled = false;
    let unlistenFn: (() => void) | null = null;

    try {
      listen<ChatTokenEvent>('chat-stream-event', (event) => {
        if (isCancelled) return;
        const { message_id, token, is_done, error } = event.payload;
        if (error) {
          setMessages((prev) =>
            prev.map((m) => (m.id === message_id ? { ...m, content: error } : m))
          );
          setIsStreaming(false);
          return;
        }

        if (token) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === message_id ? { ...m, content: m.content + token } : m
            )
          );
        }

        if (is_done) {
          setIsStreaming(false);
        }
      }).then((fn) => {
        if (isCancelled) {
          fn();
        } else {
          unlistenFn = fn;
        }
      });
    } catch {
      // Ignored outside Tauri
    }

    return () => {
      isCancelled = true;
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

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
    if (current === 'action' || current === 'listening' || current === 'success' || current === 'typing') {
      setState('idle');
      setTimeout(() => {
        notchInputRef.current?.focus();
      }, 50);
    }
  }, []);

  // Action completion
  const handleActionComplete = useCallback(() => {
    setState('success');
  }, []);

  // When prompt is submitted via Enter key:
  const handlePromptSubmit = useCallback(async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    // Immediately clear the top input bar so it's clean and ready for follow-up!
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

    // Keep focus on top input so user can type next prompt seamlessly
    setTimeout(() => {
      notchInputRef.current?.focus();
    }, 50);

    // System instruction with Mavis Agent persona
    const systemPrompt = {
      role: 'system',
      content: `You are Mavis Agent, an intelligent AI assistant. You are helpful, knowledgeable, and direct. You assist users with a wide range of tasks including answering questions, writing and editing code, analyzing information, creative work, and executing actions via your tools. You communicate clearly, admit uncertainty when appropriate, and prioritize being genuinely useful over being verbose unless otherwise directed below. Be targeted and efficient in your exploration and investigations.`,
    };

    const historyToSend = [
      systemPrompt,
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user',
        content: trimmed,
      },
    ];

    try {
      // Native Rust backend IPC invocation to stream directly from OmniRoute 127.0.0.1:20128
      await invoke('send_chat_stream', {
        messageId: assistantMsgId,
        messages: historyToSend,
      });
    } catch (err) {
      console.warn('Tauri native IPC call error, trying direct browser fetch fallback:', err);
      try {
        const response = await fetch('http://127.0.0.1:20128/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'antigravity',
            messages: historyToSend,
            stream: true,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ') && cleanLine !== 'data: [DONE]') {
              try {
                const data = JSON.parse(cleanLine.slice(6));
                const chunk = data.choices?.[0]?.delta?.content;
                if (chunk) {
                  accumulated += chunk;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulated } : m
                    )
                  );
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      } catch (fallbackErr) {
        console.error('Final model connection error:', fallbackErr);
        const errMessage = `Error: ${(fallbackErr as Error).message}`;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: errMessage } : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    }
  }, [messages]);

  // Clear active conversation session
  const handleClearSession = useCallback(() => {
    setMessages([]);
    setUserPrompt('');
    setIsStreaming(false);
    setTimeout(() => {
      notchInputRef.current?.focus();
    }, 50);
  }, []);

  // When user types in prompt:
  const handlePromptChange = useCallback((text: string) => {
    setUserPrompt(text);
    if (stateRef.current === 'idle' && text.length > 0) {
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
      const target = e.target as HTMLElement | null;
      const isTypingInNotch = target === notchInputRef.current;
      const isOtherFormInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) &&
        !isTypingInNotch;

      if (isOtherFormInput) {
        if (e.key === 'Escape') {
          target.blur();
          setState('idle');
        }
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

      // Shortcut triggers when prompt is empty
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => (prev === 'action' ? 'idle' : 'action'));
      } else if (e.key.toLowerCase() === 'd' || e.key === 'Tab') {
        e.preventDefault();
        setIsAutoDemo((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsAutoDemo(false);
        setUserPrompt('');
        setState('hidden');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  // Auto Demo Loop
  useEffect(() => {
    if (!isAutoDemo) return;

    let timer: NodeJS.Timeout;
    const runDemoStep = () => {
      const curState = stateRef.current;

      if (curState === 'idle') {
        setState('typing');
        setUserPrompt('Summarize the workspace tasks');
        timer = setTimeout(() => {
          setState('action');
        }, 1400);
      } else if (curState === 'action') {
        timer = setTimeout(() => {
          setState('success');
        }, 2800);
      } else if (curState === 'success') {
        timer = setTimeout(() => {
          setUserPrompt('');
          setState('idle');
        }, 1800);
      }
    };

    const interval = setInterval(runDemoStep, 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isAutoDemo]);

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

      {/* The Multi-Surface Floating Mavis Notch */}
      <NotchContainer
        state={state}
        intentType={intentType}
        userPrompt={userPrompt}
        messages={messages}
        isStreaming={isStreaming}
        inputRef={notchInputRef}
        onPromptChange={handlePromptChange}
        onPromptSubmit={handlePromptSubmit}
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
