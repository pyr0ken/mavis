import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Volume2,
  VolumeX,
  Heart,
  Repeat,
  Repeat1,
  Shuffle,
  ExternalLink,
} from 'lucide-react';
import { MediaStatus } from '../types/tauri-ipc';
import { mediaService } from '../services/media/mediaService';
import { LiveLyricsView } from './LiveLyricsView';
import { AudioEqualizerMirror } from './AudioEqualizerMirror';
import { extractDominantColor, ColorPalette } from '../utils/colorExtractor';

interface SpotifyCardProps {
  active: boolean;
  onClose: () => void;
}

const formatTime = (ms: number): string => {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const SpotifyCard: React.FC<SpotifyCardProps> = ({ active }) => {
  const [media, setMedia] = useState<MediaStatus>(() => mediaService.getCachedStatus());
  const [currentPositionMs, setCurrentPositionMs] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [volume, setVolume] = useState<number>(media.volume || 1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1.0);
  const [palette, setPalette] = useState<ColorPalette>({
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    subtle: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#6ee7b7',
  });

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLDivElement | null>(null);

  // High-frequency Anchor Clock references for 60fps jitter-free playback tracking
  const anchorPosRef = useRef<number>(0);
  const anchorTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(false);
  const mediaLenRef = useRef<number>(0);
  const isScrubbingRef = useRef<boolean>(false);
  const ignorePollUntilRef = useRef<number>(0);
  const prevTitleRef = useRef<string>('');

  useEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);

  // Extract dynamic dominant color from album artwork
  useEffect(() => {
    if (media.art_url) {
      extractDominantColor(media.art_url).then((newPalette) => {
        setPalette(newPalette);
      });
    }
  }, [media.art_url]);

  useEffect(() => {
    const unsub = mediaService.subscribe((status) => {
      setMedia(status);
      mediaLenRef.current = status.length_ms;
      const isPlayingNow = status.status === 'Playing';
      isPlayingRef.current = isPlayingNow;

      const now = performance.now();

      // If user recently seeked manually, ignore poll packets for 800ms to prevent rubber-banding
      if (now < ignorePollUntilRef.current) {
        return;
      }

      // If track changed, instantly snap anchor clock to the new song's start position
      const trackChanged = status.title !== prevTitleRef.current;
      if (trackChanged) {
        prevTitleRef.current = status.title;
        anchorPosRef.current = status.position_ms;
        anchorTimeRef.current = now;
        setCurrentPositionMs(status.position_ms);
        return;
      }

      const currentInterpolated = isPlayingNow
        ? anchorPosRef.current + (now - anchorTimeRef.current)
        : anchorPosRef.current;

      const drift = Math.abs(currentInterpolated - status.position_ms);

      if (!isScrubbingRef.current) {
        // Snap only on seek or major desync (> 500ms)
        if (drift > 500 || !isPlayingNow) {
          anchorPosRef.current = status.position_ms;
          anchorTimeRef.current = now;
          setCurrentPositionMs(status.position_ms);
        }
      }

      if (status.volume !== undefined) {
        setVolume(status.volume);
      }
    });
    return unsub;
  }, []);

  // 60FPS fluid clock interpolation loop
  useEffect(() => {
    let animId: number;
    let lastRenderTime = 0;

    const tick = (now: number) => {
      if (isPlayingRef.current && !isScrubbingRef.current) {
        const elapsed = now - anchorTimeRef.current;
        const pos = anchorPosRef.current + elapsed;
        const clamped = mediaLenRef.current > 0 ? Math.min(pos, mediaLenRef.current) : pos;

        if (now - lastRenderTime >= 16) {
          lastRenderTime = now;
          setCurrentPositionMs(clamped);
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const isPlaying = media.status === 'Playing';
  const hasTrack = Boolean(media.title || media.artist);
  const progressRatio =
    media.length_ms > 0 ? Math.min(1, Math.max(0, currentPositionMs / media.length_ms)) : 0;
  const remainingMs = Math.max(0, media.length_ms - currentPositionMs);

  const handleTogglePlay = async () => {
    await mediaService.togglePlayPause();
  };

  const handleNext = async () => {
    await mediaService.next();
  };

  const handlePrev = async () => {
    await mediaService.previous();
  };

  const handleSeek = (targetMs: number) => {
    anchorPosRef.current = targetMs;
    anchorTimeRef.current = performance.now();
    ignorePollUntilRef.current = performance.now() + 800;
    setCurrentPositionMs(targetMs);
    mediaService.seek(Math.floor(targetMs / 1000));
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || media.length_ms <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetMs = ratio * media.length_ms;
    handleSeek(targetMs);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(ratio);
    setIsMuted(ratio === 0);
    mediaService.setVolume(ratio);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume || 0.8);
      mediaService.setVolume(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
      mediaService.setVolume(0);
    }
  };

  const handleToggleRepeat = () => {
    if (repeatMode === 'off') {
      setRepeatMode('all');
      mediaService.sendCommand('loop Playlist');
    } else if (repeatMode === 'all') {
      setRepeatMode('one');
      mediaService.sendCommand('loop Track');
    } else {
      setRepeatMode('off');
      mediaService.sendCommand('loop None');
    }
  };

  const handleToggleShuffle = () => {
    setIsShuffle((s) => !s);
    mediaService.sendCommand('shuffle Toggle');
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    await mediaService.launchSpotify();
    setTimeout(() => {
      setIsLaunching(false);
      mediaService.refreshStatus();
    }, 1800);
  };

  return (
    <div
      className={`relative w-full h-full flex bg-[#030303] text-slate-100 select-none overflow-hidden transition-all duration-300 rounded-[24px] ${
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-98 pointer-events-none'
      }`}
    >
      {/* ========================================================= */}
      {/* GIANT FROSTED GLASS ALBUM COVER FULL-BLEED BACKDROP       */}
      {/* ========================================================= */}
      {media.art_url && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px]">
          <img
            src={media.art_url}
            alt="Backdrop"
            className="absolute -inset-10 w-[calc(100%+80px)] h-[calc(100%+80px)] object-cover filter blur-[65px] opacity-40 brightness-[0.7] transition-all duration-1000 scale-110"
          />
          <div className="absolute inset-0 bg-black/65 backdrop-blur-2xl" />
          <div
            className="absolute inset-0 mix-blend-screen opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 75% 35%, ${palette.glow}, transparent 70%)`,
            }}
          />
        </div>
      )}

      {!hasTrack && media.status === 'None' ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4 space-y-4 relative z-10">
          <div
            style={{
              backgroundColor: palette.subtle,
              borderColor: palette.border,
              boxShadow: `0 0 25px ${palette.glow}`,
            }}
            className="w-16 h-16 rounded-2xl border flex items-center justify-center"
          >
            <Music size={28} style={{ color: palette.text }} />
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-white">No Active Media Playing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Play music in Spotify or your browser to stream synchronized lyrics, real equalizer, and controls here.
            </p>
          </div>

          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            style={{
              backgroundColor: palette.primary,
              boxShadow: `0 0 20px ${palette.glow}`,
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-black font-semibold text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ExternalLink size={14} className="stroke-[2.5]" />
            <span>{isLaunching ? 'Opening Spotify...' : 'Launch Spotify'}</span>
          </button>
        </div>
      ) : (
        /* Main Immersive 2-Pane Studio: Left Lyrics & Bottom EQ, Right Docked High-Contrast Cover & Controls */
        <div className="flex-1 w-full h-full flex overflow-hidden relative z-10">
          {/* ========================================================= */}
          {/* LEFT PANE: Synchronized Live Lyrics & Bottom Equalizer    */}
          {/* ========================================================= */}
          <div className="flex-1 min-w-0 h-full flex flex-col justify-between p-4 sm:p-6 pb-2 relative z-10">
            {/* Center: Live Sentence Subtitle Stream with Smooth Word Aura */}
            <div className="flex-1 min-h-0 flex items-center my-auto">
              <LiveLyricsView
                title={media.title}
                artist={media.artist}
                durationMs={media.length_ms}
                currentPositionMs={currentPositionMs}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                accentColor={palette.primary}
                glowColor={palette.glow}
              />
            </div>

            {/* Bottom: Dynamic Mirrored Audio Equalizer */}
            <div className="w-full pt-2">
              <AudioEqualizerMirror
                isPlaying={isPlaying}
                barCount={40}
                accentColor={palette.primary}
                glowColor={palette.glow}
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANE: Edge-Snapped High-Contrast Cover & Controls   */}
          {/* ========================================================= */}
          <div className="relative w-[320px] sm:w-[350px] shrink-0 h-full flex flex-col justify-between p-5 border-l border-white/[0.08] overflow-hidden backdrop-blur-md">
            {/* Edge-Snapped Album Artwork: Sharp & Clear at Top without Dark Overlay */}
            {media.art_url ? (
              <img
                src={media.art_url}
                alt={media.title || 'Artwork'}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black pointer-events-none">
                <div className="w-40 h-40 rounded-full border border-white/5 flex items-center justify-center opacity-40">
                  <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
                    <Music size={32} style={{ color: palette.text }} />
                  </div>
                </div>
              </div>
            )}

            {/* Vertical Gradient Mask */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.4) 44%, rgba(0,0,0,0.88) 70%, #030303 92%, #030303 100%)',
              }}
            />

            {/* Left Edge Dissolve */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 10%, transparent 35%)',
              }}
            />

            {/* Top-Right Floating Controls (Heart & Spotify link) */}
            <div className="relative z-10 flex items-center justify-end gap-2 w-full pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked((l) => !l);
                }}
                title={isLiked ? 'Liked' : 'Like'}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-rose-400 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Heart
                  size={14}
                  className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-200'}
                />
              </button>

              <button
                onClick={handleLaunch}
                title="Open in Spotify"
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Bottom Deck: Typography, Scrubber, Transport Controls & Volume */}
            <div className="relative z-10 w-full space-y-3 pt-2">
              {/* Typography */}
              <div className="space-y-0.5">
                <h2
                  className="text-lg font-black text-white tracking-tight truncate leading-tight select-text drop-shadow-md"
                  title={media.title}
                >
                  {media.title || 'Unknown Track'}
                </h2>
                <p
                  style={{ color: palette.text }}
                  className="text-xs font-semibold truncate select-text drop-shadow"
                >
                  {media.artist || 'Unknown Artist'}
                  {media.album ? ` · ${media.album}` : ''}
                </p>
              </div>

              {/* Timeline Scrubber */}
              <div className="w-full space-y-1">
                <div
                  ref={progressBarRef}
                  onClick={handleSeekClick}
                  onMouseDown={() => setIsScrubbing(true)}
                  onMouseUp={() => setIsScrubbing(false)}
                  className="w-full h-1.5 rounded-full bg-white/[0.16] hover:bg-white/[0.25] cursor-pointer relative overflow-hidden transition-all group"
                >
                  <div
                    className="h-full rounded-full transition-all relative"
                    style={{
                      width: `${progressRatio * 100}%`,
                      background: `linear-gradient(to right, ${palette.primary}, #ffffff)`,
                      boxShadow: `0 0 10px ${palette.glow}`,
                    }}
                  >
                    <span
                      style={{ boxShadow: `0 0 8px ${palette.glow}` }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
                  <span className="text-slate-200 font-medium">
                    {formatTime(currentPositionMs)}
                  </span>
                  <span className="text-slate-400">
                    {media.length_ms > 0 ? `-${formatTime(remainingMs)}` : '0:00'}
                  </span>
                </div>
              </div>

              {/* Improved Transport Controls Deck with Dynamic Accent */}
              <div className="flex items-center justify-between pt-0.5">
                {/* Shuffle */}
                <button
                  onClick={handleToggleShuffle}
                  title="Shuffle"
                  style={{
                    color: isShuffle ? palette.primary : undefined,
                    backgroundColor: isShuffle ? palette.subtle : undefined,
                    borderColor: isShuffle ? palette.border : undefined,
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isShuffle
                      ? 'border'
                      : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                >
                  <Shuffle size={13} />
                </button>

                {/* Previous */}
                <button
                  onClick={handlePrev}
                  title="Previous Track"
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <SkipBack size={15} />
                </button>

                {/* Center Dynamic Accent Play / Pause Button */}
                <button
                  onClick={handleTogglePlay}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  style={{
                    background: `linear-gradient(135deg, #ffffff 0%, ${palette.primary} 70%)`,
                    boxShadow: `0 0 24px ${palette.glow}`,
                  }}
                  className="w-12 h-12 rounded-full text-black flex items-center justify-center transition-all hover:scale-105 active:scale-90 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause size={20} className="stroke-[2.8]" />
                  ) : (
                    <Play size={20} className="stroke-[2.8] ml-0.5" />
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={handleNext}
                  title="Next Track"
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <SkipForward size={15} />
                </button>

                {/* Repeat */}
                <button
                  onClick={handleToggleRepeat}
                  title={`Repeat: ${repeatMode}`}
                  style={{
                    color: repeatMode !== 'off' ? palette.primary : undefined,
                    backgroundColor: repeatMode !== 'off' ? palette.subtle : undefined,
                    borderColor: repeatMode !== 'off' ? palette.border : undefined,
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    repeatMode !== 'off'
                      ? 'border'
                      : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 size={13} /> : <Repeat size={13} />}
                </button>
              </div>

              {/* Volume Slider Deck */}
              <div className="flex items-center justify-center gap-2 pt-1 px-1">
                <button
                  onClick={handleToggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>

                <div
                  ref={volumeBarRef}
                  onClick={handleVolumeClick}
                  className="w-28 sm:w-36 h-1 rounded-full bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer relative overflow-hidden group"
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(isMuted ? 0 : volume) * 100}%`,
                      backgroundColor: palette.primary,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
