import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { Check, Sparkles, AlertCircle, Info } from 'lucide-react';
import { InteractiveBlobatar } from './InteractiveBlobatar';
import {
  IslandState,
  ActionCardType,
  ChatMessage,
  ToolExecutionState,
  ToolApprovalRequest,
  GmailDraftIntent,
  CalendarEventIntent,
} from '../types/island';
import { SlashCommand, SessionRecord, NotificationType } from '../types/commands';
import { commandRegistry, getNextGridIndex } from '../services/commands/commandRegistry';
import { ConcaveShoulders } from './ConcaveShoulders';
import { AudioWaveformBars } from './AudioWaveformBars';
import { AppleIntelligenceGlow } from './AppleIntelligenceGlow';
import { GmailComposeCard } from './GmailComposeCard';
import { CalendarEventCard } from './CalendarEventCard';
import { SlashCommandPalette } from './SlashCommandPalette';
import { HistoryDrawer } from './HistoryDrawer';
import { DashboardHubCard } from './DashboardHubCard';
import { useIslandAnimation } from '../hooks/useIslandAnimation';
import { useAnimatedPlaceholder } from '../hooks/useAnimatedPlaceholder';

const LazyChatStreamCard = lazy(() =>
  import('./ChatStreamCard').then((m) => ({ default: m.ChatStreamCard }))
);

interface NotchNotification {
  text: string;
  type?: NotificationType;
}

interface NotchContainerProps {
  state: IslandState;
  intentType?: ActionCardType;
  gmailIntent?: GmailDraftIntent | null;
  calendarIntent?: CalendarEventIntent | null;
  userPrompt?: string;
  messages?: ChatMessage[];
  isStreaming?: boolean;
  isThinking?: boolean;
  activeTool?: ToolExecutionState | null;
  approvalRequest?: ToolApprovalRequest | null;
  notification?: NotchNotification | null;
  sessions?: SessionRecord[];
  activeSessionId?: string;
  activeModelName?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onApproveTool?: (id: string) => void;
  onDenyTool?: (id: string) => void;
  onPromptChange?: (val: string) => void;
  onPromptSubmit?: (val: string) => void;
  onExecuteCommand?: (cmd: SlashCommand) => void;
  onSelectSession?: (session: SessionRecord) => void;
  onNewSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onOpenHistory?: () => void;
  onCloseHistory?: () => void;
  onInjectPrompt?: (prompt: string, autoSubmit?: boolean) => void;
  onClearSession?: () => void;
  onNotchClick: () => void;
  onActionComplete: () => void;
  onSuccessDismiss: () => void;
  onAnimationEnd?: () => void;
}

const ACTIONABLE_SUGGESTIONS = [
  'Type / for commands & skills...',
  'Schedule sprint review tomorrow at 10 AM...',
  'Summarize the active document on screen...',
  'Draft a quick reply to David regarding design...',
  'Find recent research notes in SecondBrain...',
  'Search files modified in the last 24 hours...',
  'Create calendar event with Google Meet link...',
];

export const NotchContainer: React.FC<NotchContainerProps> = ({
  state,
  intentType,
  gmailIntent,
  calendarIntent,
  userPrompt = '',
  messages = [],
  isStreaming = false,
  isThinking = false,
  activeTool = null,
  approvalRequest = null,
  notification = null,
  sessions = [],
  activeSessionId = '',
  activeModelName = 'Antigravity / Hybrid Core',
  inputRef,
  onApproveTool,
  onDenyTool,
  onPromptChange,
  onPromptSubmit,
  onExecuteCommand,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenHistory,
  onCloseHistory,
  onInjectPrompt,
  onClearSession,
  onNotchClick,
  onActionComplete,
  onSuccessDismiss,
  onAnimationEnd,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const idleContentRef = useRef<HTMLDivElement | null>(null);
  const actionContentRef = useRef<HTMLDivElement | null>(null);
  const successContentRef = useRef<HTMLDivElement | null>(null);
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeInputRef = inputRef || localTextareaRef;

  const [paletteSelectedIndex, setPaletteSelectedIndex] = useState(0);
  const [isIdleSettled, setIsIdleSettled] = useState(false);

  const isListening = state === 'listening';
  const isTyping = state === 'typing';
  const isAction = state === 'action';
  const isSuccess = state === 'success';
  const showGlow = isListening || isAction || (isTyping && userPrompt.length > 0);
  const lineCount = (userPrompt || '').split('\n').length;
  const clampedLines = Math.min(3, Math.max(1, lineCount));
  const dynamicNotchHeight = 54 + (clampedLines - 1) * 24;

  // Slash command trigger detection
  const isSlashActive = userPrompt.startsWith('/');
  const filteredCommands = isSlashActive ? commandRegistry.searchCommands(userPrompt) : [];

  // Reset selected index when filtered list changes
  useEffect(() => {
    setPaletteSelectedIndex(0);
  }, [userPrompt]);

  // Wait for opening/collapsing animation to settle before starting typewriter
  useEffect(() => {
    if (state === 'idle') {
      const timer = setTimeout(() => {
        setIsIdleSettled(true);
      }, 380);
      return () => clearTimeout(timer);
    } else {
      setIsIdleSettled(false);
    }
  }, [state]);

  useIslandAnimation({
    containerRef,
    idleContentRef,
    actionContentRef,
    successContentRef,
    state,
    lineCount,
    onAnimationEnd,
  });

  // Dynamic Typewriter Animated Placeholder (strictly disabled during closing/morphing)
  const isPlaceholderActive =
    state === 'idle' &&
    isIdleSettled &&
    !userPrompt &&
    !isListening &&
    !isAction &&
    !isSuccess;

  const animatedPlaceholder = useAnimatedPlaceholder({
    phrases: ACTIONABLE_SUGGESTIONS,
    typingSpeed: 38,
    deletingSpeed: 20,
    pauseDuration: 2200,
    active: isPlaceholderActive,
  });

  // Auto-focus the typing input whenever overlay becomes idle, typing, or action
  useEffect(() => {
    if (state === 'idle' || state === 'typing' || state === 'action') {
      const timer = setTimeout(() => {
        activeInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [state, activeInputRef]);

  // Auto-dismiss success after 1800ms
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        onSuccessDismiss();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state, onSuccessDismiss]);

  // Preload heavy markdown/LaTeX chunk during browser idle
  useEffect(() => {
    const preload = () => {
      import('./ChatStreamCard');
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const handle = (
          window as Window & { requestIdleCallback: (cb: () => void) => number }
        ).requestIdleCallback(preload);
        return () => {
          if ('cancelIdleCallback' in window) {
            (
              window as Window & { cancelIdleCallback: (id: number) => void }
            ).cancelIdleCallback(handle);
          }
        };
      } else {
        const timer = setTimeout(preload, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    onPromptChange?.('');
    onExecuteCommand?.(cmd);
  };

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-1/2 z-50 bg-[#000000] border border-white/10 border-t-0 backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] select-none pointer-events-auto transition-colors duration-300 rounded-b-[28px]"
      style={{
        width: '400px',
        height: '54px',
        borderRadius: '0 0 28px 28px',
      }}
    >
      {/* Continuous-curvature concave shoulders in pure black */}
      <ConcaveShoulders color="#000000" />

      {/* Dynamic Ambient Neon Aura & Rim Shadow (Colors match notification state: Green / Red / Amber / Blue) */}
      <AppleIntelligenceGlow
        active={showGlow}
        isSuccess={isSuccess}
        notificationType={notification?.type}
      />

      {/* Ephemeral Notification HUD Banner inside Top Bar */}
      {notification && (
        <div
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[11px] font-medium animate-in fade-in zoom-in-95 duration-200 pointer-events-none transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : notification.type === 'error'
              ? 'bg-rose-500/15 border-rose-400/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
              : notification.type === 'warning'
              ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
          }`}
        >
          {notification.type === 'success' ? (
            <Sparkles size={12} className="text-emerald-400 shrink-0" />
          ) : notification.type === 'error' ? (
            <AlertCircle size={12} className="text-rose-400 shrink-0" />
          ) : notification.type === 'warning' ? (
            <AlertCircle size={12} className="text-amber-400 shrink-0" />
          ) : (
            <Info size={12} className="text-cyan-400 shrink-0" />
          )}
          <span className="truncate max-w-[280px] font-medium">{notification.text}</span>
        </div>
      )}

      {/* Surface Layer 1: Top Bar Header */}
      <div
        ref={idleContentRef}
        onClick={(e) => {
          e.stopPropagation();
          activeInputRef.current?.focus();
        }}
        style={{
          height: `${dynamicNotchHeight}px`,
        }}
        className={`absolute inset-x-0 top-0 flex justify-between px-4 z-20 cursor-pointer bg-[#000000] rounded-[inherit] ${
          lineCount > 1 ? 'items-start pt-2 pb-2' : 'items-center'
        }`}
      >
        {/* Left: Audio Waveform Equalizer or Frameless Blobatar Avatar */}
        <div className={`flex items-center gap-2.5 shrink-0 ${lineCount > 1 ? 'self-start pt-1' : ''}`}>
          {isListening ? (
            <AudioWaveformBars active={true} />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onNotchClick();
              }}
              className="w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 cursor-pointer"
            >
              <InteractiveBlobatar name="alain00" size={38} />
            </div>
          )}
        </div>

        {/* Center: Ghost Typing Field with Glowing Live Typewriter Placeholder */}
        {!isListening && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              activeInputRef.current?.focus();
            }}
            className={`flex-1 flex px-3 cursor-text relative h-full overflow-hidden ${
              lineCount > 1 ? 'items-start pt-1.5' : 'items-center'
            }`}
          >
            {/* Animated High-Contrast Suggestion Placeholder Overlay (when idle and not hidden) */}
            {isPlaceholderActive && (
              <div className="absolute inset-x-3 inset-y-0 flex items-center pointer-events-none text-sm text-[#cbd5e1] font-normal tracking-wide overflow-hidden select-none z-0">
                <span className="truncate">{animatedPlaceholder}</span>
              </div>
            )}

            {/* Real Active Input Field */}
            <textarea
              ref={activeInputRef}
              value={userPrompt}
              onChange={(e) => {
                onPromptChange?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (isSlashActive && filteredCommands.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setPaletteSelectedIndex((prev) =>
                      getNextGridIndex(filteredCommands, prev, 'down', 2)
                    );
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setPaletteSelectedIndex((prev) =>
                      getNextGridIndex(filteredCommands, prev, 'up', 2)
                    );
                    return;
                  }
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setPaletteSelectedIndex((prev) =>
                      getNextGridIndex(filteredCommands, prev, 'right', 2)
                    );
                    return;
                  }
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setPaletteSelectedIndex((prev) =>
                      getNextGridIndex(filteredCommands, prev, 'left', 2)
                    );
                    return;
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const selected = filteredCommands[paletteSelectedIndex];
                    if (selected) {
                      onPromptChange?.(`${selected.prefix} `);
                    }
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onPromptChange?.('');
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    const selected = filteredCommands[paletteSelectedIndex];
                    if (selected) {
                      handleSelectSlashCommand(selected);
                    }
                    return;
                  }
                }

                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    // Shift + Enter: Allow multiline newline
                  } else {
                    // Enter: Instant submit
                    e.preventDefault();
                    e.stopPropagation();
                    const text = userPrompt.trim();
                    if (text.length > 0) {
                      onPromptSubmit?.(text);
                    }
                  }
                }
              }}
              rows={clampedLines}
              dir="auto"
              style={{
                unicodeBidi: 'plaintext',
                lineHeight: '24px',
                height: `${clampedLines * 24}px`,
                maxHeight: '72px',
              }}
              placeholder={isAction ? 'Type a message or / for commands...' : ''}
              className="w-full bg-transparent text-sm font-medium text-white leading-[24px] tracking-wide outline-none resize-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:text-gray-500/60 focus:text-white relative z-10 selection:bg-sky-500/50 selection:text-white text-start caret-white m-0 p-0"
            />
          </div>
        )}
      </div>

      {/* Surface Layer 2: Action Content Panel - Monolithic Unified Obsidian Canvas */}
      <div
        ref={actionContentRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          top: `${dynamicNotchHeight}px`,
          height: `calc(100% - ${dynamicNotchHeight}px)`,
        }}
        className="absolute inset-x-0 bottom-0 px-2 pb-2 z-10 hidden cursor-default"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full bg-transparent overflow-hidden"
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>Loading workspace...</span>
                </div>
              </div>
            }
          >
            {isAction && (
              isSlashActive ? (
                <SlashCommandPalette
                  commands={filteredCommands}
                  selectedIndex={paletteSelectedIndex}
                  onSelectCommand={handleSelectSlashCommand}
                  onHoverIndex={setPaletteSelectedIndex}
                  searchQuery={userPrompt.slice(1)}
                />
              ) : intentType === 'gmail' ? (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <GmailComposeCard
                    active={isAction}
                    intent={gmailIntent}
                    onSend={onActionComplete}
                  />
                </div>
              ) : intentType === 'calendar' ? (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <CalendarEventCard
                    active={isAction}
                    intent={calendarIntent}
                    onSave={onActionComplete}
                  />
                </div>
              ) : intentType === 'history' ? (
                <HistoryDrawer
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={(sess) => {
                    onSelectSession?.(sess);
                  }}
                  onNewSession={() => {
                    onNewSession?.();
                  }}
                  onDeleteSession={(id) => {
                    onDeleteSession?.(id);
                  }}
                  onClose={() => {
                    onCloseHistory?.();
                  }}
                />
              ) : messages.length === 0 ? (
                <DashboardHubCard
                  sessions={sessions}
                  activeModelName={activeModelName}
                  onSelectSession={(sess) => {
                    onSelectSession?.(sess);
                  }}
                  onOpenHistory={() => {
                    onOpenHistory?.();
                  }}
                  onExecuteCommand={(cmd) => {
                    onExecuteCommand?.(cmd);
                  }}
                  onInjectPrompt={(prompt, autoSubmit) => {
                    onInjectPrompt?.(prompt, autoSubmit);
                  }}
                />
              ) : (
                <LazyChatStreamCard
                  active={isAction}
                  messages={messages}
                  isStreaming={isStreaming}
                  isThinking={isThinking}
                  activeTool={activeTool}
                  approvalRequest={approvalRequest}
                  onApproveTool={onApproveTool}
                  onDenyTool={onDenyTool}
                  onFocusInput={() => {
                    activeInputRef.current?.focus();
                  }}
                  onClearSession={onClearSession}
                  onClose={onActionComplete}
                />
              )
            )}
          </Suspense>
        </div>
      </div>

      {/* Surface Layer 3: Success Confirmation Pill (Absolute Inset-0) */}
      <div
        ref={successContentRef}
        onClick={(e) => {
          e.stopPropagation();
          onSuccessDismiss();
        }}
        className="absolute inset-0 flex items-center justify-center gap-3 px-5 select-none z-20 hidden cursor-pointer rounded-[inherit]"
      >
        <span className="text-sm font-semibold text-white tracking-wide">
          Conversation closed
        </span>
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
        </div>
      </div>
    </div>
  );
};
