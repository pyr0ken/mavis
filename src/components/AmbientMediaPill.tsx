import React, { useState, useEffect } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { MediaStatus } from '../types/tauri-ipc';
import { mediaService } from '../services/media/mediaService';

interface AmbientMediaPillProps {
  onOpenSpotifyCard: () => void;
}

export const AmbientMediaPill: React.FC<AmbientMediaPillProps> = ({
  onOpenSpotifyCard,
}) => {
  const [media, setMedia] = useState<MediaStatus>(() => mediaService.getCachedStatus());

  useEffect(() => {
    const unsub = mediaService.subscribe((status) => {
      setMedia(status);
    });
    return unsub;
  }, []);

  const isPlaying = media.status === 'Playing';
  const hasTrack = Boolean(media.title || media.artist);

  if (!hasTrack && media.status === 'None') {
    return null;
  }

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediaService.togglePlayPause();
  };

  return (
    <div
      onClick={onOpenSpotifyCard}
      className="flex-1 flex items-center justify-between px-2.5 h-full cursor-pointer select-none group transition-all"
      title={`${media.title || 'Track'} - ${media.artist || 'Artist'} (Click to open controls)`}
    >
      {/* Left: Album Cover Thumbnail or Animated Spotify Icon */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="relative flex items-center justify-center shrink-0">
          {media.art_url ? (
            <img
              src={media.art_url}
              alt="Album Art"
              className={`w-6 h-6 rounded-md object-cover border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-transform ${
                isPlaying ? 'scale-100' : 'opacity-70'
              }`}
            />
          ) : (
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.25)]">
              <Music size={12} className="text-emerald-400" />
            </div>
          )}
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        {/* Center: Track Title & Artist */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors truncate max-w-[170px]">
            {media.title || 'Unknown Track'}
          </span>

          {media.artist && (
            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors truncate max-w-[110px] hidden sm:inline">
              {media.artist}
            </span>
          )}
        </div>
      </div>

      {/* Right: Mini Audio Waveform or Quick Play/Pause Action */}
      <div className="flex items-center gap-2 shrink-0 pl-2">
        {/* Equalizer Bars */}
        {isPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5 px-1 py-0.5">
            <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite] h-3" />
            <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[equalizer_1.1s_ease-in-out_infinite_0.2s] h-2" />
            <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[equalizer_0.9s_ease-in-out_infinite_0.4s] h-3.5" />
            <span className="w-[2.5px] bg-emerald-400 rounded-full animate-[equalizer_1.2s_ease-in-out_infinite_0.1s] h-2" />
          </div>
        ) : null}

        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 flex items-center justify-center text-slate-300 hover:text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          {isPlaying ? (
            <Pause size={12} className="stroke-[2.5]" />
          ) : (
            <Play size={12} className="stroke-[2.5] ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};
