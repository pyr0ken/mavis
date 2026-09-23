import React from 'react';
import { Clock, Video, CheckCircle2 } from 'lucide-react';
import { ContactChip } from './ContactChip';
import { useTypewriterStream } from '../hooks/useTypewriterStream';
import { CalendarEventIntent } from '../types/island';

interface CalendarEventCardProps {
  active: boolean;
  intent?: CalendarEventIntent | null;
  onSave: () => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  active,
  intent,
  onSave,
}) => {
  const targetTitle = intent?.title || 'Design review with David';
  const targetDateTime = intent?.dateTime || 'Thursday · 2:00 – 2:30 PM';
  const attendeeEmail = intent?.attendee?.email || 'david@company.com';
  const attendeeName = intent?.attendee?.name || 'David Miller';
  const locationOrService = intent?.locationOrService || 'Google Meet';

  const {
    displayedText: titleText,
    setDisplayedText: setTitleText,
  } = useTypewriterStream({
    text: targetTitle,
    speed: 24,
    active,
  });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full h-full flex flex-col justify-between text-left select-text bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white/[0.04] border-b border-white/[0.08] select-none">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
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
          <span className="text-sm font-semibold text-white tracking-wide">
            New Event
          </span>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        {/* Title Input with Vibrant Focus Underline */}
        <div className="relative pb-2">
          <input
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            placeholder="Add event title"
            className="w-full bg-transparent text-base font-semibold text-white placeholder-gray-500 outline-none"
          />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2B7FFF] to-cyan-400 shadow-[0_0_10px_rgba(43,127,255,0.7)]" />
        </div>

        {/* Date & Time Row */}
        <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
          <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <span>{targetDateTime}</span>
        </div>

        {/* Attendee Row with Blobatar */}
        <div className="flex items-center gap-3">
          <ContactChip email={attendeeEmail} name={attendeeName} />
        </div>

        {/* Conferencing Row */}
        <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Video className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <span>{locationOrService} video call enabled</span>
        </div>
      </div>

      {/* Bottom Footer / Action Button */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-t border-white/[0.08] select-none">
        <span className="text-xs text-gray-400 font-medium">
          Ready to schedule · Click Save
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-[#2B7FFF] to-[#1E6FE8] hover:from-[#388BFF] hover:to-[#2B7FFF] active:scale-95 text-white font-semibold text-sm shadow-[0_4px_16px_rgba(43,127,255,0.4)] hover:shadow-[0_6px_20px_rgba(43,127,255,0.6)] transition-all duration-150 cursor-pointer"
        >
          <span>Save Event</span>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
