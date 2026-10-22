import { invoke } from '@tauri-apps/api/core';
import { MediaStatus } from '../../types/tauri-ipc';

export type MediaEventListener = (status: MediaStatus) => void;

const artworkCache = new Map<string, string>();

async function fetchUnblockedArtwork(title: string, artist: string): Promise<string> {
  if (!title && !artist) return '';

  const cleanTitle = title
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .replace(/ • .*/, '')
    .trim();
  const cleanArtist = artist
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .trim();

  const cacheKey = `${cleanArtist.toLowerCase()}|||${cleanTitle.toLowerCase()}`;
  if (artworkCache.has(cacheKey)) {
    return artworkCache.get(cacheKey)!;
  }

  const query = `${cleanArtist} ${cleanTitle}`.trim();
  if (!query) return '';

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
        const art = data.results[0].artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
        artworkCache.set(cacheKey, art);
        return art;
      }
    }

    // Fallback: search without entity constraint
    const fallbackRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle || query)}&limit=1`
    );
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      if (fbData.results && fbData.results.length > 0 && fbData.results[0].artworkUrl100) {
        const art = fbData.results[0].artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
        artworkCache.set(cacheKey, art);
        return art;
      }
    }
  } catch {
    // Non-blocking on network offline
  }

  return '';
}

class MediaService {
  private currentStatus: MediaStatus = {
    player: '',
    status: 'None',
    artist: '',
    title: '',
    album: '',
    art_url: '',
    position_ms: 0,
    length_ms: 0,
    volume: 1.0,
    is_spotify: false,
    available_players: [],
  };

  private listeners: Set<MediaEventListener> = new Set();
  private pollInterval: NodeJS.Timeout | null = null;
  private activeArtLookupKey = '';

  constructor() {
    this.refreshStatus();
  }

  public getCachedStatus(): MediaStatus {
    return this.currentStatus;
  }

  public async refreshStatus(player?: string): Promise<MediaStatus> {
    try {
      const status = await invoke<MediaStatus>('get_media_status', { player });
      await this.enrichArtwork(status);
      this.updateStatus(status);
      return status;
    } catch {
      return this.currentStatus;
    }
  }

  public async sendCommand(command: string, player?: string): Promise<MediaStatus> {
    try {
      const status = await invoke<MediaStatus>('send_media_command', { command, player });
      await this.enrichArtwork(status);
      this.updateStatus(status);
      return status;
    } catch {
      if (command === 'play-pause' || command === 'toggle') {
        const nextStatus = this.currentStatus.status === 'Playing' ? 'Paused' : 'Playing';
        this.updateStatus({ ...this.currentStatus, status: nextStatus });
      }
      return this.currentStatus;
    }
  }

  public async togglePlayPause(): Promise<MediaStatus> {
    return this.sendCommand('play-pause');
  }

  public async next(): Promise<MediaStatus> {
    return this.sendCommand('next');
  }

  public async previous(): Promise<MediaStatus> {
    return this.sendCommand('previous');
  }

  public async seek(positionSec: number): Promise<MediaStatus> {
    return this.sendCommand(`position ${Math.max(0, positionSec)}`);
  }

  public async setVolume(levelRatio: number): Promise<MediaStatus> {
    const clamped = Math.max(0, Math.min(1, levelRatio));
    return this.sendCommand(`volume ${clamped.toFixed(2)}`);
  }

  public async launchSpotify(): Promise<boolean> {
    try {
      return await invoke<boolean>('launch_spotify');
    } catch {
      window.open('https://open.spotify.com', '_blank');
      return true;
    }
  }

  public async startVisualizer(bars = 36): Promise<boolean> {
    try {
      return await invoke<boolean>('start_audio_visualizer', { bars });
    } catch {
      return false;
    }
  }

  public async stopVisualizer(): Promise<void> {
    try {
      await invoke<void>('stop_audio_visualizer');
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: MediaEventListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);

    if (this.listeners.size === 1) {
      this.startPolling();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  private async enrichArtwork(status: MediaStatus) {
    if (!status.title && !status.artist) return;

    const cacheKey = `${status.artist}|||${status.title}`;

    // If local base64 data URL already present from Rust, use it
    if (status.art_url && status.art_url.startsWith('data:image/')) {
      return;
    }

    // Check if we have an unblocked CDN cover cached
    if (artworkCache.has(cacheKey)) {
      status.art_url = artworkCache.get(cacheKey)!;
      return;
    }

    // If art_url is missing, is a raw file:// url that failed base64, or is from scdn.co (which is 403 blocked in Iran), resolve via Apple Music CDN
    if (!status.art_url || status.art_url.includes('scdn.co') || status.art_url.startsWith('file://')) {
      if (this.activeArtLookupKey !== cacheKey) {
        this.activeArtLookupKey = cacheKey;
        fetchUnblockedArtwork(status.title, status.artist).then((art) => {
          if (art && this.currentStatus.title === status.title) {
            this.currentStatus.art_url = art;
            this.notifyListeners();
          }
        });
      }
    }
  }

  private updateStatus(newStatus: MediaStatus) {
    this.currentStatus = newStatus;
    this.notifyListeners();
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentStatus);
      } catch (err) {
        console.error('Error in media listener:', err);
      }
    }
  }

  private startPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.refreshStatus();
    }, 1200);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const mediaService = new MediaService();
