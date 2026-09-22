import React from 'react';

interface AppleIntelligenceGlowProps {
  active: boolean;
  isSuccess?: boolean;
  className?: string;
}

export const AppleIntelligenceGlow: React.FC<AppleIntelligenceGlowProps> = ({
  active,
  isSuccess = false,
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 rounded-[inherit] pointer-events-none transition-all duration-300 z-0 ${className}`}
      style={{
        boxShadow: isSuccess
          ? `
            0 0 0 1px rgba(52, 211, 153, 0.6),
            0 10px 30px -4px rgba(52, 211, 153, 0.4)
          `
          : active
          ? `
            0 0 0 1px rgba(255, 255, 255, 0.2),
            0 20px 48px -4px rgba(0, 0, 0, 0.9)
          `
          : `
            0 0 0 1px rgba(255, 255, 255, 0.14),
            0 16px 36px -4px rgba(0, 0, 0, 0.85)
          `,
      }}
    />
  );
};
