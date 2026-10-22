/**
 * TypeScript definitions for Mavis Tauri Native IPC Commands & Events
 */

export interface ShellExecResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
}

export interface FileSearchResult {
  matches: string[];
  total_found: number;
}

export interface FileReadResult {
  content: string;
  total_lines: number;
  truncated: boolean;
}

export interface FtsSearchResult {
  message_id: string;
  session_id: string;
  snippet: string;
  rank: number;
}

export interface MediaStatus {
  player: string;
  status: 'Playing' | 'Paused' | 'Stopped' | 'None' | string;
  artist: string;
  title: string;
  album: string;
  art_url: string;
  position_ms: number;
  length_ms: number;
  volume: number;
  is_spotify: boolean;
  available_players: string[];
}

export interface LyricsPayload {
  title: string;
  artist: string;
  synced_lyrics?: string | null;
  plain_lyrics?: string | null;
  live_active_line?: string | null;
  live_prev_line?: string | null;
  live_next_line?: string | null;
}

export interface WindowCommands {
  center_top_window: () => Promise<void>;
  show_window: () => Promise<void>;
  hide_window: () => Promise<void>;
  set_cursor_click_through: (args: { ignore: boolean }) => Promise<void>;
  execute_shell_command: (args: { command: string }) => Promise<ShellExecResult>;
  search_workspace_files: (args: { pattern: string; path?: string; maxResults?: number }) => Promise<FileSearchResult>;
  read_workspace_file: (args: { path: string; maxLines?: number }) => Promise<FileReadResult>;
  search_messages_fts: (args: { query: string; limit?: number }) => Promise<FtsSearchResult[]>;
  get_user_profile: () => Promise<Record<string, string>>;
  set_user_profile_key: (args: { key: string; value: string }) => Promise<void>;
  get_media_status: (args?: { player?: string }) => Promise<MediaStatus>;
  send_media_command: (args: { command: string; player?: string }) => Promise<MediaStatus>;
  launch_spotify: () => Promise<boolean>;
  start_audio_visualizer: (args?: { bars?: number }) => Promise<boolean>;
  stop_audio_visualizer: () => Promise<void>;
  fetch_lyrics: (args: { title: string; artist: string }) => Promise<LyricsPayload>;
}

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
      event: {
        listen: (event: string, handler: (event: unknown) => void) => Promise<() => void>;
      };
    };
  }
}
