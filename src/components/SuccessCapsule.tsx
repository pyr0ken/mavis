import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { ActionCardType } from '../types/island';

interface SuccessCapsuleProps {
  intentType: ActionCardType;
  onDismiss: () => void;
  durationMs?: number;
}

export const SuccessCapsule: React.FC<SuccessCapsuleProps> = ({
  intentType,
  onDismiss,
  durationMs = 1800,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  const isGmail = intentType === 'gmail';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#16181F]/95 border border-white/20 backdrop-blur-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.85),0_0_20px_rgba(56,189,248,0.3)] select-none cursor-pointer hover:border-white/30 transition-all duration-200 animate-in fade-in zoom-in-95"
    >
      {/* App Icon */}
      {isGmail ? (
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path
              fill="#EA4335"
              d="M12 13.5L1.5 5.25V18c0 .83.67 1.5 1.5 1.5h18c.83 0 1.5-.67 1.5-1.5V5.25L12 13.5z"
            />
            <path
              fill="#FBBC05"
              d="M22.5 4.5H19.5v7.5l3-2.25V6c0-.83-.67-1.5-1.5-1.5z"
            />
            <path
              fill="#34A853"
              d="M1.5 4.5h3v7.5l-3-2.25V6c0-.83.67-1.5 1.5-1.5z"
            />
            <path
              fill="#4285F4"
              d="M19.5 4.5L12 10.5 4.5 4.5H1.5c-.24 0-.46.06-.66.16L12 13.5l11.16-8.84c-.2-.1-.42-.16-.66-.16h-3z"
            />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <rect width="20" height="20" x="2" y="2" rx="4" fill="#FFFFFF" />
            <path fill="#4285F4" d="M18 2H6a4 4 0 0 0-4 4v2h20V6a4 4 0 0 0-4-4z" />
            <circle cx="7" cy="5" r="1" fill="#FFFFFF" />
            <circle cx="17" cy="5" r="1" fill="#FFFFFF" />
            <text
              x="12"
              y="17"
              textAnchor="middle"
              fill="#4285F4"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              31
            </text>
          </svg>
        </div>
      )}

      {/* Confirmation Label */}
      <span className="text-sm font-semibold text-white tracking-wide">
        {isGmail ? 'Email sent' : 'Scheduled'}
      </span>

      {/* Confirmation Checkmark */}
      <Check className="w-4 h-4 text-sky-400 stroke-[2.5]" />
    </div>
  );
};
