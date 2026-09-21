import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformBarsProps {
  active: boolean;
  barCount?: number;
}

export const AudioWaveformBars: React.FC<AudioWaveformBarsProps> = ({
  active,
  barCount = 4,
}) => {
  const [heights, setHeights] = useState<number[]>([10, 20, 28, 14]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setHeights([6, 6, 6, 6]);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      // Organic fluid harmonic oscillations
      const h1 = 10 + Math.sin(elapsed * 7.5) * 8 + Math.sin(elapsed * 3.2) * 5;
      const h2 = 18 + Math.sin(elapsed * 9.0 + 1.2) * 12 + Math.cos(elapsed * 4.5) * 6;
      const h3 = 24 + Math.sin(elapsed * 8.2 + 2.4) * 14 + Math.sin(elapsed * 5.1) * 6;
      const h4 = 14 + Math.cos(elapsed * 6.8 + 0.8) * 10 + Math.sin(elapsed * 4.0) * 5;

      setHeights([
        Math.max(6, Math.min(28, Math.round(h1))),
        Math.max(8, Math.min(36, Math.round(h2))),
        Math.max(10, Math.min(38, Math.round(h3))),
        Math.max(6, Math.min(28, Math.round(h4))),
      ]);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, barCount]);

  return (
    <div className="flex items-center gap-1.5 h-8 px-1.5 select-none pointer-events-none">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[5px] bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
};
