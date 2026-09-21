/**
 * TypeScript definitions for Mavis Tauri Native IPC Commands
 */

export interface WindowCommands {
  center_top_window: () => Promise<void>;
  show_window: () => Promise<void>;
  hide_window: () => Promise<void>;
  set_cursor_click_through: (args: { ignore: boolean }) => Promise<void>;
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
