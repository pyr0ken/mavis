import { useEffect, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

interface UseGlobalShortcutOptions {
  onToggle: () => void;
}

export const useGlobalShortcut = ({ onToggle }: UseGlobalShortcutOptions) => {
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  useEffect(() => {
    let unlistenTauri: UnlistenFn | undefined;

    // Single source of truth: Listen to native Tauri Global Keyhook event for Ctrl + Alt
    const initTauriListener = async () => {
      try {
        unlistenTauri = await listen('global-shortcut-triggered', () => {
          onToggleRef.current();
        });
      } catch {
        // Fallback for standard web development server preview
        const handleDevKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.altKey) {
            e.preventDefault();
            onToggleRef.current();
          }
        };
        window.addEventListener('keydown', handleDevKeyDown);
        return () => window.removeEventListener('keydown', handleDevKeyDown);
      }
    };

    initTauriListener();

    return () => {
      if (unlistenTauri) unlistenTauri();
    };
  }, []);
};
