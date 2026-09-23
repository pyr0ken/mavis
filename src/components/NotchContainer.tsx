import React, { useRef, useEffect, lazy, Suspense } from 'react';
import { Check } from 'lucide-react';
import { InteractiveBlobatar } from './InteractiveBlobatar';
import { IslandState, ActionCardType, ChatMessage } from '../types/island';
import { ConcaveShoulders } from './ConcaveShoulders';
import { AudioWaveformBars } from './AudioWaveformBars';
import { AppleIntelligenceGlow } from './AppleIntelligenceGlow';
import { useIslandAnimation } from '../hooks/useIslandAnimation';
import { useAnimatedPlaceholder } from '../hooks/useAnimatedPlaceholder';

const LazyChatStreamCard = lazy(() =>
  import('./ChatStreamCard').then((m) => ({ default: m.ChatStreamCard }))
);

interface NotchContainerProps {
  state: IslandState;
  intentType?: ActionCardType;
  userPrompt?: string;
  messages?: ChatMessage[];
  isStreaming?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onPromptChange?: (val: string) => void;
  onPromptSubmit?: (val: string) => void;
  onClearSession?: () => void;
  onNotchClick: () => void;
  onActionComplete: () => void;
  onSuccessDismiss: () => void;
  onAnimationEnd?: () => void;
}

const ACTIONABLE_SUGGESTIONS = [
  'Whisper or type a command...',
  'Schedule sprint review tomorrow at 10 AM...',
  'Summarize the active document on screen...',
  'Draft a quick reply to David regarding design...',
  'Find recent research notes in SecondBrain...',
  'Search files modified in the last 24 hours...',
  'Create calendar event with Google Meet link...',
];

export const NotchContainer: React.FC<NotchContainerProps> = ({
  state,
  userPrompt = '',
  messages = [],
  isStreaming = false,
  inputRef,
  onPromptChange,
  onPromptSubmit,
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

  const isListening = state === 'listening';
  const isTyping = state === 'typing';
  const isAction = state === 'action';
  const isSuccess = state === 'success';
  const showGlow = isListening || isAction || (isTyping && userPrompt.length > 0);
  const lineCount = (userPrompt || '').split('\n').length;
  const clampedLines = Math.min(3, Math.max(1, lineCount));
  const dynamicNotchHeight = 54 + (clampedLines - 1) * 24;

  useIslandAnimation({
    containerRef,
    idleContentRef,
    actionContentRef,
    successContentRef,
    state,
    lineCount,
    onAnimationEnd,
  });

  // Dynamic Typewriter Animated Placeholder for Suggested Commands
  const animatedPlaceholder = useAnimatedPlaceholder({
    phrases: ACTIONABLE_SUGGESTIONS,
    typingSpeed: 38,
    deletingSpeed: 20,
    pauseDuration: 2200,
    active: !userPrompt && !isListening && !isAction && !isSuccess,
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
        const handle = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(preload);
        return () => {
          if ('cancelIdleCallback' in window) {
            (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
          }
        };
      } else {
        const timer = setTimeout(preload, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

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

      {/* Dark Glass Rim Light & Shadow */}
      <AppleIntelligenceGlow active={showGlow} isSuccess={isSuccess} />

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
            {/* Animated High-Contrast Suggestion Placeholder Overlay (when idle) */}
            {!userPrompt && !isAction && (
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
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    // Shift + Enter: Allow multiline newline
                  } else {
                    // Enter: Instant submit without any buttons
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
              placeholder={isAction ? 'Type a follow-up message...' : ''}
              className="w-full bg-transparent text-sm font-medium text-white leading-[24px] tracking-wide outline-none resize-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:text-gray-500/60 focus:text-white relative z-10 selection:bg-sky-500/50 selection:text-white text-start caret-white m-0 p-0"
            />
          </div>
        )}
      </div>

      {/* Surface Layer 2: Action Content Panel */}
      <div
        ref={actionContentRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          top: `${dynamicNotchHeight}px`,
          height: `calc(100% - ${dynamicNotchHeight}px)`,
        }}
        className="absolute inset-x-0 bottom-0 px-4 pb-4 z-10 hidden cursor-default"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full rounded-[22px] bg-[#16181F]/95 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden"
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
              <LazyChatStreamCard
                active={isAction}
                messages={messages}
                isStreaming={isStreaming}
                onClearSession={onClearSession}
                onClose={onActionComplete}
              />
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
