import React, { useEffect, useRef, useState } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { mediaService } from '../services/media/mediaService';

interface AudioEqualizerMirrorProps {
  isPlaying: boolean;
  barCount?: number;
  accentColor?: string;
  glowColor?: string;
  className?: string;
}

export const AudioEqualizerMirror: React.FC<AudioEqualizerMirrorProps> = ({
  isPlaying,
  barCount = 38,
  accentColor = '#10b981',
  glowColor = 'rgba(16, 185, 129, 0.45)',
  className = '',
}) => {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(0.08));
  const [hasRealCava, setHasRealCava] = useState<boolean>(false);
  const realCavaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const targetBarsRef = useRef<number[]>(Array(barCount).fill(0.08));
  const currentBarsRef = useRef<number[]>(Array(barCount).fill(0.08));

  // 1. CAVA FFT listener
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    let isCancelled = false;

    const setupCava = async () => {
      try {
        await mediaService.startVisualizer(barCount);
        if (isCancelled) return;

        unlisten = await listen<number[]>('cava_bars', (event) => {
          if (!event.payload || !Array.isArray(event.payload)) return;

          setHasRealCava(true);
          if (realCavaTimeoutRef.current) {
            clearTimeout(realCavaTimeoutRef.current);
          }
          realCavaTimeoutRef.current = setTimeout(() => {
            setHasRealCava(false);
          }, 800);

          const payload = event.payload;
          const targetLen = barCount;
          const step = payload.length / targetLen;

          const resampled: number[] = [];
          for (let i = 0; i < targetLen; i++) {
            const idx = Math.min(payload.length - 1, Math.floor(i * step));
            const bassBoost = i < targetLen * 0.35 ? 1.25 : 1.0;
            const val = Math.min(1.0, (payload[idx] || 0) * bassBoost);
            resampled.push(Math.max(0.06, val));
          }
          targetBarsRef.current = resampled;
        });
      } catch {}
    };

    setupCava();

    return () => {
      isCancelled = true;
      if (unlisten) unlisten();
      if (realCavaTimeoutRef.current) clearTimeout(realCavaTimeoutRef.current);
      mediaService.stopVisualizer().catch(() => {});
    };
  }, [barCount]);

  // 2. High-energy 60FPS fluid physics & audio wave animation
  useEffect(() => {
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      if (!isPlaying) {
        // Idle ambient gentle breathing wave when paused
        const resting = currentBarsRef.current.map((curr, i) => {
          const wave = Math.sin(elapsed * 2.2 + (i / barCount) * Math.PI * 2) * 0.04 + 0.08;
          return curr + (wave - curr) * 0.15;
        });
        currentBarsRef.current = resting;
        setBars([...resting]);
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (hasRealCava) {
        const smoothed = currentBarsRef.current.map((curr, i) => {
          const target = targetBarsRef.current[i] ?? 0.08;
          const speed = target > curr ? 0.55 : 0.25;
          return curr + (target - curr) * speed;
        });
        currentBarsRef.current = smoothed;
        setBars([...smoothed]);
      } else {
        // Multi-layered rhythmic harmonic wave simulation (rich musical bounce)
        const synthetic = Array.from({ length: barCount }).map((_, i) => {
          const normIdx = i / barCount;
          const beatKick = Math.pow(Math.max(0, Math.sin(elapsed * 4.2)), 3) * 0.45;
          const bass = (Math.sin(elapsed * 7.5 + normIdx * 4.0) * 0.35 + 0.4) * (1 - normIdx * 0.5);
          const mid = Math.sin(elapsed * 13.0 + normIdx * 8.5 + 1.2) * 0.28;
          const treble = Math.sin(elapsed * 18.0 + normIdx * 14.0 + 2.5) * 0.18 * (normIdx * 0.8 + 0.2);
          const shimmer = (Math.random() - 0.5) * 0.06;

          const envelope = Math.sin(normIdx * Math.PI) * 0.45 + 0.35;
          const raw = (bass + mid + treble + beatKick + shimmer) * envelope;
          return Math.max(0.08, Math.min(1.0, raw));
        });

        const smoothed = currentBarsRef.current.map((curr, i) => {
          const target = synthetic[i];
          const speed = target > curr ? 0.42 : 0.22;
          return curr + (target - curr) * speed;
        });
        currentBarsRef.current = smoothed;
        setBars([...smoothed]);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, hasRealCava, barCount]);

  return (
    <div className={`relative w-full flex flex-col items-center select-none pointer-events-none ${className}`}>
      {/* Upper Vibrant Spectrum Bars */}
      <div className="w-full h-16 sm:h-20 flex items-end justify-between gap-[2px] sm:gap-[3px] px-2 overflow-hidden">
        {bars.map((val, idx) => {
          const heightPercent = Math.round(Math.max(8, val * 100));
          return (
            <div
              key={idx}
              className="flex-1 min-w-[3px] max-w-[10px] flex flex-col justify-end items-center h-full"
            >
              <div
                style={{
                  height: `${heightPercent}%`,
                  background: `linear-gradient(to top, rgba(255,255,255,0.15) 0%, ${accentColor} 60%, #ffffff 100%)`,
                  boxShadow: isPlaying ? `0 0 12px ${glowColor}` : 'none',
                }}
                className="w-full rounded-t-full relative transition-[height] duration-75 ease-out"
              >
                {/* Luminous Neon Glass Top Cap */}
                <div
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 0 8px #ffffff' }}
                  className="absolute top-0 inset-x-0 h-[2.5px] rounded-full opacity-90"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Glossy Horizon Line */}
      <div
        style={{
          background: `linear-gradient(to right, transparent 0%, ${glowColor} 50%, transparent 100%)`,
        }}
        className="w-full h-[1.5px] my-[1px] opacity-80"
      />

      {/* Mirrored Reflection Floor (Glass Reflection Fade) */}
      <div
        className="w-full h-8 sm:h-10 flex items-start justify-between gap-[2px] sm:gap-[3px] px-2 overflow-hidden opacity-30"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        }}
      >
        {bars.map((val, idx) => {
          const heightPercent = Math.round(val * 100 * 0.7);
          return (
            <div
              key={idx}
              className="flex-1 min-w-[3px] max-w-[10px] flex flex-col justify-start items-center h-full"
            >
              <div
                style={{
                  height: `${Math.max(4, heightPercent)}%`,
                  background: `linear-gradient(to bottom, ${accentColor} 0%, transparent 100%)`,
                }}
                className="w-full rounded-b-full transition-[height] duration-75 ease-out blur-[0.6px]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
