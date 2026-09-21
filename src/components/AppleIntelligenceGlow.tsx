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
            0 0 0 1px rgba(52, 211, 153, 0.5),
            0 10px 40px -5px rgba(52, 211, 153, 0.4),
            0 25px 60px -10px rgba(0, 0, 0, 0.95)
          `
          : active
          ? `
            0 0 0 1px rgba(255, 255, 255, 0.15),
            0 30px 80px -10px rgba(0, 0, 0, 0.98)
          `
          : `
            0 0 0 1px rgba(255, 255, 255, 0.12),
            0 20px 50px -10px rgba(0, 0, 0, 0.9)
          `,
      }}
    />
  );
};
