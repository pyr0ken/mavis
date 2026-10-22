import React, { useEffect, useRef, useState } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { mediaService } from '../services/media/mediaService';

interface AudioEqualizerMirrorProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export const AudioEqualizerMirror: React.FC<AudioEqualizerMirrorProps> = ({
  isPlaying,
  barCount = 36,
  className = '',
}) => {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(0.04));
  const [hasRealCava, setHasRealCava] = useState<boolean>(false);
  const realCavaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const targetBarsRef = useRef<number[]>(Array(barCount).fill(0.04));
  const currentBarsRef = useRef<number[]>(Array(barCount).fill(0.04));

  // 1. Start CAVA audio visualizer via native backend & listen for real-time FFT bars
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
          // Mark real cava inactive if no packets arrive for 800ms
          realCavaTimeoutRef.current = setTimeout(() => {
            setHasRealCava(false);
          }, 800);

          const payload = event.payload;
          const targetLen = barCount;
          const step = payload.length / targetLen;

          const resampled: number[] = [];
          for (let i = 0; i < targetLen; i++) {
            const idx = Math.min(payload.length - 1, Math.floor(i * step));
            // Add subtle bass boost for visual aesthetic
            const bassBoost = i < targetLen * 0.35 ? 1.15 : 1.0;
            const val = Math.min(1.0, (payload[idx] || 0) * bassBoost);
            resampled.push(Math.max(0.04, val));
          }
          targetBarsRef.current = resampled;
        });
      } catch {
        // Fallback to organic harmonic synth if cava is unavailable
      }
    };

    setupCava();

    return () => {
      isCancelled = true;
      if (unlisten) unlisten();
      if (realCavaTimeoutRef.current) clearTimeout(realCavaTimeoutRef.current);
      mediaService.stopVisualizer().catch(() => {});
    };
  }, [barCount]);

  // 2. Smooth 60FPS fluid interpolation loop with organic wave fallback
  useEffect(() => {
    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      if (!isPlaying) {
        // Smoothly decay to resting floor when paused
        let updated = false;
        const next = currentBarsRef.current.map((v) => {
          const decayed = Math.max(0.03, v * 0.88);
          if (Math.abs(decayed - v) > 0.001) updated = true;
          return decayed;
        });
        currentBarsRef.current = next;
        setBars(next);
        if (updated) {
          animFrameRef.current = requestAnimationFrame(render);
        }
        return;
      }

      if (hasRealCava) {
        // Smooth lerp towards real CAVA FFT readings (fast attack, smooth release)
        const smoothed = currentBarsRef.current.map((curr, i) => {
          const target = targetBarsRef.current[i] ?? 0.04;
          const speed = target > curr ? 0.45 : 0.22;
          return curr + (target - curr) * speed;
        });
        currentBarsRef.current = smoothed;
        setBars([...smoothed]);
      } else {
        // Organic multi-harmonic acoustic spectrum simulation fallback
        const synthetic = Array.from({ length: barCount }).map((_, i) => {
          const normIdx = i / barCount;
          // Frequency-dependent wave harmonics
          const bass = Math.sin(elapsed * 6.5 + normIdx * 3.0) * 0.35 + 0.4;
          const mid = Math.sin(elapsed * 11.0 + normIdx * 7.5 + 1.2) * 0.25;
          const treble = Math.sin(elapsed * 16.0 + normIdx * 12.0 + 2.5) * 0.15;
          const pulse = Math.sin(elapsed * 3.2) * 0.1;

          // Natural EQ slope (higher amplitude in low-mids, tapering into highs)
          const eqCurve = Math.sin(normIdx * Math.PI) * 0.4 + 0.35;
          const raw = (bass + mid + treble + pulse) * eqCurve;
          return Math.max(0.05, Math.min(0.95, raw));
        });

        // Lerp synthetic bars smoothly
        const smoothed = currentBarsRef.current.map((curr, i) => {
          const target = synthetic[i];
          return curr + (target - curr) * 0.28;
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
      {/* Upper Glass Spectrum Bars */}
      <div className="w-full h-10 flex items-end justify-between gap-[2px] sm:gap-[3px] px-2">
        {bars.map((val, idx) => {
          const heightPercent = Math.round(val * 100);
          return (
            <div
              key={idx}
              className="flex-1 min-w-[2px] max-w-[8px] flex flex-col justify-end items-center h-full group"
            >
              <div
                style={{ height: `${Math.max(6, heightPercent)}%` }}
                className="w-full rounded-t-full bg-gradient-to-t from-emerald-500/70 via-teal-400 to-cyan-300 relative shadow-[0_0_10px_rgba(45,212,191,0.45)] transition-[height] duration-75 ease-out"
              >
                {/* Luminous Neon Glass Tip */}
                <div className="absolute top-0 inset-x-0 h-[2px] rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Razor-Thin Glossy Horizon Baseline */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.3)] my-[1px]" />

      {/* Mirrored Reflection Floor (Inverted with Glass Fade Mask) */}
      <div
        className="w-full h-6 flex items-start justify-between gap-[2px] sm:gap-[3px] px-2 overflow-hidden opacity-35"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        }}
      >
        {bars.map((val, idx) => {
          const heightPercent = Math.round(val * 100 * 0.65);
          return (
            <div
              key={idx}
              className="flex-1 min-w-[2px] max-w-[8px] flex flex-col justify-start items-center h-full"
            >
              <div
                style={{ height: `${Math.max(3, heightPercent)}%` }}
                className="w-full rounded-b-full bg-gradient-to-b from-teal-400/80 via-emerald-500/50 to-transparent transition-[height] duration-75 ease-out blur-[0.5px]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
