import React, { useState, useEffect, useRef } from 'react';
import { Blobatar } from '@blobatar/react';
import 'blobatar/motion.css';

interface InteractiveBlobatarProps {
  name?: string;
  size?: number; // pixel size, default 38
  className?: string;
}

export const InteractiveBlobatar: React.FC<InteractiveBlobatarProps> = ({
  name = 'alain00',
  size = 38,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lookX, setLookX] = useState(0);
  const [lookY, setLookY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const avatarCenterX = rect.left + rect.width / 2;
      const avatarCenterY = rect.top + rect.height / 2;

      // Distance and direction from avatar to mouse
      const deltaX = e.clientX - avatarCenterX;
      const deltaY = e.clientY - avatarCenterY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > 5) {
        // Normalize and scale to Blobatar's look range (-1.6 to +1.6)
        const factor = Math.min(1, distance / 350);
        const targetLookX = (deltaX / distance) * 1.5 * factor;
        const targetLookY = (deltaY / distance) * 1.2 * factor;

        setLookX(parseFloat(targetLookX.toFixed(2)));
        setLookY(parseFloat(targetLookY.toFixed(2)));
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-full overflow-hidden flex items-center justify-center select-none cursor-pointer transition-transform duration-200 ${
        isHovered ? 'scale-110' : 'scale-100'
      } ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        // Pass mouse tracking variables into Blobatar SVG CSS variables
        ['--mo-look-x' as string]: lookX,
        ['--mo-look-mx' as string]: Math.abs(lookX),
        ['--mo-look-y' as string]: lookY,
        ['--mo-look-my' as string]: Math.abs(lookY),
      }}
    >
      <Blobatar
        name={name}
        traits={{
          'body.r': 0.857,
          'body.ratio': 0.163,
          'body.n': 0.774,
          tone: 0.1,
        }}
        tone={0.1}
        animate="always"
        className="w-full h-full"
      />
    </div>
  );
};
