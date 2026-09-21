import React from 'react';

interface ConcaveShouldersProps {
  color?: string;
}

export const ConcaveShoulders: React.FC<ConcaveShouldersProps> = ({
  color = '#000000',
}) => {
  return (
    <>
      {/* Left Continuous-Curvature Inverted Fillet */}
      <svg
        className="absolute top-0 -left-[35.5px] w-[36px] h-[36px] pointer-events-none z-50 transition-colors duration-200"
        style={{ fill: color }}
        viewBox="0 0 36 36"
      >
        <path d="M 0 0 C 22 0, 36 10, 36 36 L 36 0 Z" />
      </svg>

      {/* Right Continuous-Curvature Inverted Fillet */}
      <svg
        className="absolute top-0 -right-[35.5px] w-[36px] h-[36px] pointer-events-none scale-x-[-1] z-50 transition-colors duration-200"
        style={{ fill: color }}
        viewBox="0 0 36 36"
      >
        <path d="M 0 0 C 22 0, 36 10, 36 36 L 36 0 Z" />
      </svg>
    </>
  );
};
