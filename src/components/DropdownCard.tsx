import React from 'react';
import { ActionCardType, GmailDraftIntent, CalendarEventIntent } from '../types/island';
import { AppleIntelligenceGlow } from './AppleIntelligenceGlow';
import { GmailComposeCard } from './GmailComposeCard';
import { CalendarEventCard } from './CalendarEventCard';

interface DropdownCardProps {
  active: boolean;
  intentType: ActionCardType;
  gmailIntent?: GmailDraftIntent | null;
  calendarIntent?: CalendarEventIntent | null;
  onActionComplete: () => void;
}

export const DropdownCard: React.FC<DropdownCardProps> = ({
  active,
  intentType,
  gmailIntent,
  calendarIntent,
  onActionComplete,
}) => {
  return (
    <div
      className={`relative w-[540px] rounded-[18px] transition-all duration-300 ${
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        minHeight: '270px',
      }}
    >
      <AppleIntelligenceGlow active={active} className="rounded-[18px]" />

      <div className="relative z-10 w-full h-full rounded-[18px] bg-[#000000]/90 backdrop-blur-3xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden">
        {intentType === 'gmail' ? (
          <GmailComposeCard active={active} intent={gmailIntent} onSend={onActionComplete} />
        ) : (
          <CalendarEventCard active={active} intent={calendarIntent} onSave={onActionComplete} />
        )}
      </div>
    </div>
  );
};
