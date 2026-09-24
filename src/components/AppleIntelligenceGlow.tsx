import React from 'react';
import { NotificationType } from '../types/commands';

interface AppleIntelligenceGlowProps {
  active: boolean;
  isSuccess?: boolean;
  notificationType?: NotificationType | null;
  className?: string;
}

export const AppleIntelligenceGlow: React.FC<AppleIntelligenceGlowProps> = ({
  active,
  isSuccess = false,
  notificationType = null,
  className = '',
}) => {
  // Determine dynamic shadow aura based on notification type or active state
  const getBoxShadow = () => {
    if (notificationType === 'success' || isSuccess) {
      // Emerald Green Neon Aura
      return `
        0 0 0 1.5px rgba(52, 211, 153, 0.75),
        0 12px 36px -2px rgba(16, 185, 129, 0.5),
        0 0 45px rgba(52, 211, 153, 0.3)
      `;
    }

    if (notificationType === 'error') {
      // Rose / Red Neon Aura
      return `
        0 0 0 1.5px rgba(244, 63, 94, 0.8),
        0 12px 36px -2px rgba(239, 68, 68, 0.55),
        0 0 45px rgba(244, 63, 94, 0.35)
      `;
    }

    if (notificationType === 'warning') {
      // Amber / Orange Neon Aura
      return `
        0 0 0 1.5px rgba(245, 158, 11, 0.8),
        0 12px 36px -2px rgba(217, 119, 6, 0.5),
        0 0 45px rgba(245, 158, 11, 0.3)
      `;
    }

    if (notificationType === 'info') {
      // Electric Cyan / Blue Neon Aura
      return `
        0 0 0 1.5px rgba(6, 182, 212, 0.8),
        0 12px 36px -2px rgba(59, 130, 246, 0.5),
        0 0 45px rgba(6, 182, 212, 0.3)
      `;
    }

    if (active) {
      // Active Notch Glow (Subtle White Rim Light + Deep Ambient Shadow)
      return `
        0 0 0 1px rgba(255, 255, 255, 0.2),
        0 20px 48px -4px rgba(0, 0, 0, 0.9)
      `;
    }

    // Default Idle Rim
    return `
      0 0 0 1px rgba(255, 255, 255, 0.14),
      0 16px 36px -4px rgba(0, 0, 0, 0.85)
    `;
  };

  return (
    <div
      className={`absolute inset-0 rounded-[inherit] pointer-events-none transition-all duration-300 z-0 ${className}`}
      style={{
        boxShadow: getBoxShadow(),
      }}
    />
  );
};
