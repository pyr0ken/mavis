import React, { useEffect, useState, useRef } from 'react';
import { Mic, Music2 } from 'lucide-react';
import { lyricsService, SongLyrics, LyricLine } from '../services/media/lyricsService';

interface LiveLyricsViewProps {
  title: string;
  artist: string;
  durationMs: number;
  currentPositionMs: number;
  isPlaying?: boolean;
  onSeek: (positionMs: number) => void;
  accentColor?: string;
  glowColor?: string;
  className?: string;
}

export const LiveLyricsView: React.FC<LiveLyricsViewProps> = ({
  title,
  artist,
  durationMs,
  currentPositionMs,
  isPlaying = true,
  onSeek,
  accentColor = '#10b981',
  glowColor = 'rgba(16, 185, 129, 0.45)',
  className = '',
}) => {
  const [lyrics, setLyrics] = useState<SongLyrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [offsetMs, setOffsetMs] = useState<number>(() => {
    const saved = localStorage.getItem('mavis_lyrics_offset_ms');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const handleAdjustOffset = (delta: number) => {
    setOffsetMs((prev) => {
      const next = prev + delta;
      localStorage.setItem('mavis_lyrics_offset_ms', next.toString());
      return next;
    });
  };

  // Pull back by offset to match acoustic speaker latency and audio buffer
  const syncedPositionMs = Math.max(0, currentPositionMs + offsetMs);

  useEffect(() => {
    const unsub = lyricsService.onLyricsUpdate((liveLyrics) => {
      if (liveLyrics) {
        setLyrics(liveLyrics);
        setIsLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!title && !artist) {
      setLyrics(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    lyricsService
      .fetchLyrics(title, artist, durationMs)
      .then((res) => {
        if (!isMounted) return;
        setLyrics(res);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLyrics(null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [title, artist, durationMs]);

  const lines = lyrics?.lines || [];

  // Determine active line index: last line whose start time <= syncedPositionMs
  let activeIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (syncedPositionMs >= lines[i].timeMs) {
      activeIndex = i;
    } else {
      break;
    }
  }

  const activeLine: LyricLine | null = lines[activeIndex] || null;
  const prevLine: LyricLine | null = activeIndex > 0 ? lines[activeIndex - 1] : null;
  const nextLine: LyricLine | null = activeIndex < lines.length - 1 ? lines[activeIndex + 1] : null;
  const futureLine: LyricLine | null = activeIndex < lines.length - 2 ? lines[activeIndex + 2] : null;

  const prevLineText = prevLine ? prevLine.text : '';
  const nextLineText = nextLine ? nextLine.text : '';

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-center px-4 sm:px-8 py-4 select-none overflow-hidden ${className}`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center animate-pulse">
              <Mic size={18} className="text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-xs font-mono text-emerald-300/80 tracking-wider">
            SYNCING LIVE LYRICS...
          </span>
        </div>
      ) : !lyrics || lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center space-y-3 px-6">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
            <Music2 size={24} className="stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-300 tracking-wide">
              {title || 'Instrumental Track'}
            </p>
            <p className="text-xs text-slate-500">
              {artist ? artist : 'Lyrics unavailable'}
            </p>
          </div>
        </div>
      ) : (
        /* Live Dynamic Karaoke Subtitle Stream (Always Live Subtitle) */
        <div className="w-full flex flex-col justify-center space-y-3.5 md:space-y-5">
          {/* Previous Sentence (Fading Out Upwards) */}
          {prevLineText && (
            <div
              onClick={() => prevLine && onSeek(prevLine.timeMs)}
              className="text-xs sm:text-sm md:text-base font-medium text-white/30 hover:text-white/60 cursor-pointer transition-all duration-300 truncate"
              title="Click to jump here"
            >
              {prevLineText}
            </div>
          )}

          {/* ACTIVE SENTENCE (Front, Bold, Large with Smooth Dynamic Aura Progression) */}
          {activeLine && (
            <div
              ref={activeLineRef}
              onClick={() => onSeek(activeLine.timeMs)}
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-relaxed cursor-pointer select-text transition-all duration-300 py-1"
            >
              {activeLine.words.map((word, wIdx) => {
                const isPast = syncedPositionMs >= word.endMs;
                const isCurrent =
                  isPlaying &&
                  syncedPositionMs >= word.startMs &&
                  syncedPositionMs <= word.endMs + 100;

                // Continuous word progress (0.0 -> 1.0)
                const wordDur = Math.max(80, word.endMs - word.startMs);
                const progressRatio = Math.max(
                  0,
                  Math.min(1, (syncedPositionMs - word.startMs) / wordDur)
                );

                return (
                  <span key={wIdx} className="relative inline-block mr-2.5 my-0.5">
                    {isCurrent && (
                      <span
                        className="absolute -inset-x-2 -inset-y-1 rounded-xl blur-sm pointer-events-none transition-opacity duration-200 animate-pulse"
                        style={{ background: glowColor }}
                      />
                    )}
                    <span
                      style={
                        isCurrent
                          ? {
                              background: `linear-gradient(90deg, #ffffff 0%, ${accentColor} ${Math.round(
                                progressRatio * 100
                              )}%, rgba(255,255,255,0.35) ${Math.min(
                                100,
                                Math.round(progressRatio * 100 + 20)
                              )}%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }
                          : undefined
                      }
                      className={`relative z-10 transition-all duration-150 ${
                        isCurrent
                          ? 'font-black scale-[1.05] inline-block'
                          : isPast
                          ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'text-white/28 font-medium'
                      }`}
                    >
                      {word.text}
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Next Sentence (Preview Below) */}
          {nextLineText && (
            <div
              onClick={() => nextLine && onSeek(nextLine.timeMs)}
              className="text-sm sm:text-base md:text-lg font-semibold text-white/45 hover:text-white/80 cursor-pointer transition-all duration-300 truncate"
              title="Click to jump here"
            >
              {nextLineText}
            </div>
          )}

          {/* Subsequent Sentence (Distant Preview) */}
          {futureLine && (
            <div
              onClick={() => onSeek(futureLine.timeMs)}
              className="text-xs sm:text-sm font-normal text-white/20 hover:text-white/50 cursor-pointer transition-all duration-300 truncate hidden sm:block"
              title="Click to jump here"
            >
              {futureLine.text}
            </div>
          )}

          {/* Real-time Fine-tune Sync Calibration Pill */}
          <div className="flex items-center justify-start gap-2 pt-1 text-[11px] text-white/25 hover:text-white/60 transition-colors">
            <span className="font-mono tracking-wider">
              OFFSET: {offsetMs > 0 ? `+${offsetMs}ms` : `${offsetMs}ms`}
            </span>
            <button
              onClick={() => handleAdjustOffset(-100)}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white cursor-pointer"
              title="Lyrics too fast / ahead? Push lyrics later (-100ms)"
            >
              -0.1s
            </button>
            <button
              onClick={() => handleAdjustOffset(+100)}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white cursor-pointer"
              title="Lyrics too slow / behind? Pull lyrics earlier (+100ms)"
            >
              +0.1s
            </button>
            {offsetMs !== -650 && (
              <button
                onClick={() => {
                  setOffsetMs(-650);
                  localStorage.setItem('mavis_lyrics_offset_ms', '-650');
                }}
                className="text-[10px] text-emerald-400/60 hover:text-emerald-300 ml-1 cursor-pointer"
                title="Reset to calibrated default (-650ms)"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
