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

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLDivElement | null>(null);

  // High-frequency Anchor Clock references for 60fps jitter-free playback tracking
  const anchorPosRef = useRef<number>(0);
  const anchorTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(false);
  const mediaLenRef = useRef<number>(0);
  const isScrubbingRef = useRef<boolean>(false);

  useEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);

  useEffect(() => {
    const unsub = mediaService.subscribe((status) => {
      setMedia(status);
      mediaLenRef.current = status.length_ms;
      const isPlayingNow = status.status === 'Playing';
      isPlayingRef.current = isPlayingNow;

      const now = performance.now();
      const currentInterpolated = isPlayingNow
        ? anchorPosRef.current + (now - anchorTimeRef.current)
        : anchorPosRef.current;

      const drift = Math.abs(currentInterpolated - status.position_ms);

      if (!isScrubbingRef.current) {
        // Snap only on seek or major desync (> 400ms); otherwise smoothly absorb clock drift
        if (drift > 400 || !isPlayingNow) {
          anchorPosRef.current = status.position_ms;
          anchorTimeRef.current = now;
          setCurrentPositionMs(status.position_ms);
        } else {
          anchorPosRef.current = currentInterpolated + (status.position_ms - currentInterpolated) * 0.25;
          anchorTimeRef.current = now;
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
      className={`relative w-full h-full flex bg-[#000000] text-slate-100 select-none overflow-hidden transition-all duration-300 rounded-[24px] ${
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-98 pointer-events-none'
      }`}
    >
      {!hasTrack && media.status === 'None' ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <Music size={28} className="text-emerald-400" />
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 cursor-pointer"
          >
            <ExternalLink size={14} className="stroke-[2.5]" />
            <span>{isLaunching ? 'Opening Spotify...' : 'Launch Spotify'}</span>
          </button>
        </div>
      ) : (
        /* Main Immersive 2-Pane Studio: Left Lyrics & Bottom EQ, Right Docked High-Contrast Cover & Controls */
        <div className="flex-1 w-full h-full flex overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT PANE: Synchronized Live Lyrics & Bottom Equalizer    */}
          {/* ========================================================= */}
          <div className="flex-1 min-w-0 h-full flex flex-col justify-between p-4 sm:p-6 pb-2 relative z-10">
            {/* Center: Live Sentence Subtitle Stream with Smooth Continuous Word Aura */}
            <div className="flex-1 min-h-0 flex items-center my-auto">
              <LiveLyricsView
                title={media.title}
                artist={media.artist}
                durationMs={media.length_ms}
                currentPositionMs={currentPositionMs}
                isPlaying={isPlaying}
                onSeek={handleSeek}
              />
            </div>

            {/* Bottom: Real Glass & Mirrored Equalizer */}
            <div className="w-full pt-2">
              <AudioEqualizerMirror isPlaying={isPlaying} barCount={36} />
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANE: Edge-Snapped High-Contrast Cover & Controls   */}
          {/* ========================================================= */}
          <div className="relative w-[320px] sm:w-[350px] shrink-0 h-full flex flex-col justify-between p-5 border-l border-white/[0.06] overflow-hidden">
            {/* Edge-Snapped Album Artwork: Sharp & Clear at Top without Dark Overlay */}
            {media.art_url ? (
              <img
                src={media.art_url}
                alt={media.title || 'Artwork'}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-900 via-emerald-950/20 to-black pointer-events-none">
                <div className="w-40 h-40 rounded-full border border-white/5 flex items-center justify-center opacity-40">
                  <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
                    <Music size={32} className="text-emerald-400/60" />
                  </div>
                </div>
              </div>
            )}

            {/* Vertical Gradient Mask: Top is clear & shadow-free, bottom gradually fades to rich black */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0.35) 46%, rgba(0,0,0,0.85) 70%, #000000 90%, #000000 100%)',
              }}
            />

            {/* Left Edge Dissolve into Pure Black Canvas */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, #000000 0%, rgba(0,0,0,0.85) 6%, rgba(0,0,0,0.2) 18%, transparent 35%)',
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
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-300 hover:text-emerald-300 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Bottom Deck: Typography, Scrubber, Transport Controls & Volume */}
            <div className="relative z-10 w-full space-y-3 pt-2">
              {/* Typography */}
              <div className="space-y-0.5">
                <h2
                  className="text-lg font-black text-white tracking-tight truncate leading-tight select-text"
                  title={media.title}
                >
                  {media.title || 'Unknown Track'}
                </h2>
                <p className="text-xs font-semibold text-emerald-300/90 truncate select-text">
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
                  className="w-full h-1.5 rounded-full bg-white/[0.14] hover:bg-white/[0.22] cursor-pointer relative overflow-hidden transition-all group"
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full transition-all relative"
                    style={{ width: `${progressRatio * 100}%` }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-0 group-hover:opacity-100 transition-opacity" />
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

              {/* Improved Transport Controls Deck */}
              <div className="flex items-center justify-between pt-0.5">
                {/* Shuffle */}
                <button
                  onClick={handleToggleShuffle}
                  title="Shuffle"
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isShuffle
                      ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/30'
                      : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                >
                  <Shuffle size={13} />
                </button>

                {/* Previous */}
                <button
                  onClick={handlePrev}
                  title="Previous Track (P)"
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <SkipBack size={15} />
                </button>

                {/* Center Glowing Play / Pause Button with Neon Aura */}
                <button
                  onClick={handleTogglePlay}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 text-black flex items-center justify-center transition-all hover:scale-105 active:scale-90 shadow-[0_0_24px_rgba(20,184,166,0.6)] cursor-pointer"
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
                  title="Next Track (N)"
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <SkipForward size={15} />
                </button>

                {/* Repeat */}
                <button
                  onClick={handleToggleRepeat}
                  title={`Repeat: ${repeatMode}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    repeatMode !== 'off'
                      ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/30'
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
                    className="h-full bg-white group-hover:bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
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
