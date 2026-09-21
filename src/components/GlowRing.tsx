import React from 'react';

interface GlowRingProps {
  active: boolean;
}

export const GlowRing: React.FC<GlowRingProps> = ({ active }) => {
  return (
    <div
      className={`absolute inset-[-3px] rounded-[inherit] transition-opacity duration-400 pointer-events-none z-0 ${
        active ? 'opacity-90' : 'opacity-0'
      }`}
      style={{
        background:
          'conic-gradient(from 180deg at 50% 50%, #38bdf8, #818cf8, #c084fc, #f472b6, #fb923c, #38bdf8)',
        filter: 'blur(10px)',
      }}
    />
  );
};
