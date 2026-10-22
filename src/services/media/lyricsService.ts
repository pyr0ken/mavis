import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { LyricsPayload } from '../../types/tauri-ipc';

export interface LyricWord {
  text: string;
  startMs: number;
  endMs: number;
}

export interface LyricLine {
  id: number;
  timeMs: number;
  endTimeMs: number;
  text: string;
  words: LyricWord[];
}

export interface SongLyrics {
  title: string;
  artist: string;
  lines: LyricLine[];
  hasSync: boolean;
  plainText?: string;
  liveActiveLine?: string;
  livePrevLine?: string;
  liveNextLine?: string;
}

const lyricsCache = new Map<string, SongLyrics>();

function cleanName(str: string): string {
  return str
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .replace(/\s*-\s*Single/i, '')
    .replace(/\s*-\s*Remastered/i, '')
    .replace(/\s*•\s*.*/, '')
    .trim();
}

/**
 * Parse standard LRC string ([mm:ss.xx] Lyric text) into structured lines with word timings
 */
export function parseLrc(lrcText: string, _totalDurationMs?: number): LyricLine[] {
  if (!lrcText) return [];

  const rawLines = lrcText.split('\n');
  const parsed: { timeMs: number; text: string }[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})(?:\\.(\d{2,3}))?\]/g;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    timeRegex.lastIndex = 0;
    const match = timeRegex.exec(trimmed);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const msPart = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const timeMs = min * 60 * 1000 + sec * 1000 + msPart;
      const text = trimmed.replace(timeRegex, '').trim();

      if (text) {
        parsed.push({ timeMs, text });
      }
    }
  }

  // Sort by start timestamp
  parsed.sort((a, b) => a.timeMs - b.timeMs);

  const lines: LyricLine[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const curr = parsed[i];
    const next = parsed[i + 1];

    const rawWords = curr.text.split(/\s+/).filter(Boolean);
    // Typical vocal cadence: ~320ms per word + 350ms buffer, capped to the next line's start
    const naturalSingingDuration = Math.max(800, rawWords.length * 320 + 350);
    const gapToNext = next ? Math.max(500, next.timeMs - curr.timeMs) : 4500;
    const duration = Math.min(gapToNext, naturalSingingDuration);
    const endTimeMs = curr.timeMs + duration;

    // Compute relative weights based on word length for natural singing cadence
    const totalChars = rawWords.reduce((acc, w) => acc + Math.max(2, w.length), 0);
    let accumulatedTime = curr.timeMs;

    const words: LyricWord[] = rawWords.map((word) => {
      const charWeight = Math.max(2, word.length) / Math.max(1, totalChars);
      const wordDuration = Math.max(100, duration * charWeight);
      const startMs = Math.round(accumulatedTime);
      const endMs = Math.round(startMs + wordDuration);
      accumulatedTime += wordDuration;

      return {
        text: word,
        startMs,
        endMs,
      };
    });

    lines.push({
      id: i,
      timeMs: curr.timeMs,
      endTimeMs,
      text: curr.text,
      words,
    });
  }

  return lines;
}

export function createLinesFromPlainText(plainText: string, totalDurationMs?: number): LyricLine[] {
  if (!plainText) return [];

  const rawLines = plainText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return [];

  const totalMs = totalDurationMs && totalDurationMs > 10000 ? totalDurationMs : 180000;
  const introMs = Math.min(8000, totalMs * 0.08);
  const vocalMs = totalMs - introMs;
  const lineDuration = vocalMs / rawLines.length;

  return rawLines.map((text, idx) => {
    const timeMs = Math.round(introMs + idx * lineDuration);
    const endTimeMs = Math.round(introMs + (idx + 1) * lineDuration);
    const rawWords = text.split(/\s+/).filter(Boolean);
    const totalChars = rawWords.reduce((acc, w) => acc + Math.max(2, w.length), 0);
    let accumulated = timeMs;

    const words: LyricWord[] = rawWords.map((w) => {
      const weight = Math.max(2, w.length) / Math.max(1, totalChars);
      const wDuration = Math.max(100, (endTimeMs - timeMs) * weight);
      const startMs = Math.round(accumulated);
      const endMs = Math.round(startMs + wDuration);
      accumulated += wDuration;
      return { text: w, startMs, endMs };
    });

    return {
      id: idx,
      timeMs,
      endTimeMs,
      text,
      words,
    };
  });
}

class LyricsService {
  private updateListeners: Set<(lyrics: SongLyrics) => void> = new Set();

  constructor() {
    listen<LyricsPayload>('spotify_lyrics_update', (event) => {
      const payload = event.payload;
      if (payload) {
        const lines = payload.synced_lyrics ? parseLrc(payload.synced_lyrics) : [];
        const songLyrics: SongLyrics = {
          title: payload.title,
          artist: payload.artist,
          lines,
          hasSync: lines.length > 0 || Boolean(payload.live_active_line),
          plainText: payload.plain_lyrics || undefined,
          liveActiveLine: payload.live_active_line || undefined,
          livePrevLine: payload.live_prev_line || undefined,
          liveNextLine: payload.live_next_line || undefined,
        };
        const cacheKey = `${(payload.artist || '').toLowerCase()}:::${(payload.title || '').toLowerCase()}`;
        lyricsCache.set(cacheKey, songLyrics);
        this.notifyUpdate(songLyrics);
      }
    }).catch(() => {});
  }

  public onLyricsUpdate(listener: (lyrics: SongLyrics) => void): () => void {
    this.updateListeners.add(listener);
    return () => this.updateListeners.delete(listener);
  }

  private notifyUpdate(lyrics: SongLyrics) {
    for (const listener of this.updateListeners) {
      try {
        listener(lyrics);
      } catch {}
    }
  }

  public clearCache() {
    lyricsCache.clear();
  }

  public async fetchLyrics(rawTitle: string, rawArtist: string, durationMs?: number): Promise<SongLyrics | null> {
    if (!rawTitle) return null;

    const title = cleanName(rawTitle);
    const artist = cleanName(rawArtist);
    const cacheKey = `${artist.toLowerCase()}:::${title.toLowerCase()}`;

    // Return cached entry if it has verified live synchronization
    if (lyricsCache.has(cacheKey)) {
      const cached = lyricsCache.get(cacheKey)!;
      if (cached.hasSync && cached.lines.length > 0) {
        return cached;
      }
    }

    try {
      // Invoke native Rust backend command (populated live from Chrome Spotify session)
      const payload = await invoke<LyricsPayload>('fetch_lyrics', {
        title,
        artist,
      });

      if (payload && (payload.synced_lyrics || payload.live_active_line)) {
        const lines = payload.synced_lyrics ? parseLrc(payload.synced_lyrics, durationMs) : [];
        const songLyrics: SongLyrics = {
          title: payload.title || title,
          artist: payload.artist || artist,
          lines,
          hasSync: lines.length > 0 || Boolean(payload.live_active_line),
          plainText: payload.plain_lyrics || undefined,
          liveActiveLine: payload.live_active_line || undefined,
          livePrevLine: payload.live_prev_line || undefined,
          liveNextLine: payload.live_next_line || undefined,
        };
        lyricsCache.set(cacheKey, songLyrics);
        return songLyrics;
      }

      if (payload && payload.plain_lyrics) {
        const lines = createLinesFromPlainText(payload.plain_lyrics, durationMs);
        const songLyrics: SongLyrics = {
          title: payload.title || title,
          artist: payload.artist || artist,
          lines,
          hasSync: false,
          plainText: payload.plain_lyrics,
        };
        return songLyrics;
      }
    } catch (err) {
      console.warn('Chrome Spotify lyrics bridge query:', err);
    }

    return null;
  }
}

export const lyricsService = new LyricsService();
