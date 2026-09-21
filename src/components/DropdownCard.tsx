import React from 'react';
import { ActionCardType } from '../types/island';
import { AppleIntelligenceGlow } from './AppleIntelligenceGlow';
import { GmailComposeCard } from './GmailComposeCard';
import { CalendarEventCard } from './CalendarEventCard';

interface DropdownCardProps {
  active: boolean;
  intentType: ActionCardType;
  onActionComplete: () => void;
}

export const DropdownCard: React.FC<DropdownCardProps> = ({
  active,
  intentType,
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
      {/* Apple Intelligence Electric Cyan/Blue Perimeter Rim Glow */}
      <AppleIntelligenceGlow active={active} className="rounded-[18px]" />

      {/* Obsidian Dark Glass Container */}
      <div className="relative z-10 w-full h-full rounded-[18px] bg-[#16181F]/95 backdrop-blur-3xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden">
        {intentType === 'gmail' ? (
          <GmailComposeCard active={active} onSend={onActionComplete} />
        ) : (
          <CalendarEventCard active={active} onSave={onActionComplete} />
        )}
      </div>
    </div>
  );
};
