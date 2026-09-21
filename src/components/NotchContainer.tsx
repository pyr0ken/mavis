import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import { InteractiveBlobatar } from './InteractiveBlobatar';
import { IslandState, ActionCardType } from '../types/island';
import { ConcaveShoulders } from './ConcaveShoulders';
import { AudioWaveformBars } from './AudioWaveformBars';
import { AppleIntelligenceGlow } from './AppleIntelligenceGlow';
import { GmailComposeCard } from './GmailComposeCard';
import { CalendarEventCard } from './CalendarEventCard';
import { useIslandAnimation } from '../hooks/useIslandAnimation';

interface NotchContainerProps {
  state: IslandState;
  intentType: ActionCardType;
  onNotchClick: () => void;
  onActionComplete: () => void;
  onSuccessDismiss: () => void;
  onAnimationEnd?: () => void;
}

export const NotchContainer: React.FC<NotchContainerProps> = ({
  state,
  intentType,
  onNotchClick,
  onActionComplete,
  onSuccessDismiss,
  onAnimationEnd,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const idleContentRef = useRef<HTMLDivElement | null>(null);
  const actionContentRef = useRef<HTMLDivElement | null>(null);
  const successContentRef = useRef<HTMLDivElement | null>(null);

  useIslandAnimation({
    containerRef,
    idleContentRef,
    actionContentRef,
    successContentRef,
    state,
    onAnimationEnd,
  });

  // Auto-dismiss success after 1800ms
  React.useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        onSuccessDismiss();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state, onSuccessDismiss]);

  const isListening = state === 'listening';
  const isAction = state === 'action';
  const isSuccess = state === 'success';
  const showGlow = isListening || isAction;

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-1/2 z-50 bg-[#000000] border border-white/10 border-t-0 backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] select-none pointer-events-auto transition-colors duration-300 rounded-b-[28px]"
      style={{
        width: '380px',
        height: '54px',
        borderRadius: '0 0 28px 28px',
      }}
    >
      {/* Continuous-curvature concave shoulders in pure black */}
      <ConcaveShoulders color="#000000" />

      {/* Dark Glass Rim Light & Shadow */}
      <AppleIntelligenceGlow active={showGlow} isSuccess={isSuccess} />

      {/* Surface Layer 1: Top Bar Header (Clickable to Toggle/Close - Inheriting Container Border Radius) */}
      <div
        ref={idleContentRef}
        onClick={(e) => {
          e.stopPropagation();
          onNotchClick();
        }}
        className="absolute inset-x-0 top-0 h-[54px] flex items-center justify-between px-4 z-10 cursor-pointer bg-transparent rounded-[inherit]"
      >
        {/* Left: Audio Waveform Equalizer (when listening) or Frameless Larger Blobatar Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isListening ? (
            <AudioWaveformBars active={true} />
          ) : (
            <div className="w-[44px] h-[44px] rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105">
              <InteractiveBlobatar name="alain00" size={44} />
            </div>
          )}
        </div>

        {/* Right Status Pulse Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isListening || isAction
                ? 'bg-sky-400 animate-ping shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                : 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]'
            }`}
          />
        </div>
      </div>

      {/* Surface Layer 2: Action Content Panel (Absolute Bottom-Locked from y=54px) */}
      <div
        ref={actionContentRef}
        onClick={(e) => {
          // Never close the action card when clicking anywhere inside it
          e.stopPropagation();
        }}
        className="absolute inset-x-0 top-[54px] bottom-0 px-4 pb-4 z-10 hidden cursor-default"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full rounded-[22px] bg-[#16181F]/95 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden"
        >
          {intentType === 'gmail' ? (
            <GmailComposeCard active={isAction} onSend={onActionComplete} />
          ) : (
            <CalendarEventCard active={isAction} onSave={onActionComplete} />
          )}
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
        {intentType === 'gmail' ? (
          <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#EA4335" d="M12 13.5L1.5 5.25V18c0 .83.67 1.5 1.5 1.5h18c.83 0 1.5-.67 1.5-1.5V5.25L12 13.5z" />
              <path fill="#FBBC05" d="M22.5 4.5H19.5v7.5l3-2.25V6c0-.83-.67-1.5-1.5-1.5z" />
              <path fill="#34A853" d="M1.5 4.5h3v7.5l-3-2.25V6c0-.83.67-1.5 1.5-1.5z" />
              <path fill="#4285F4" d="M19.5 4.5L12 10.5 4.5 4.5H1.5c-.24 0-.46.06-.66.16L12 13.5l11.16-8.84c-.2-.1-.42-.16-.66-.16h-3z" />
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <rect width="20" height="20" x="2" y="2" rx="4" fill="#FFFFFF" />
              <path fill="#4285F4" d="M18 2H6a4 4 0 0 0-4 4v2h20V6a4 4 0 0 0-4-4z" />
              <circle cx="7" cy="5" r="1" fill="#FFFFFF" />
              <circle cx="17" cy="5" r="1" fill="#FFFFFF" />
              <text x="12" y="17" textAnchor="middle" fill="#4285F4" fontSize="9" fontWeight="bold" fontFamily="sans-serif">31</text>
            </svg>
          </div>
        )}
        <span className="text-sm font-semibold text-white tracking-wide">
          {intentType === 'gmail' ? 'Email sent' : 'Event scheduled'}
        </span>
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
        </div>
      </div>
    </div>
  );
};
