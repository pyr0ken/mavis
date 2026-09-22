import React, { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { IslandState, ActionCardType } from './types/island';
import { NotchContainer } from './components/NotchContainer';
import { useGlobalShortcut } from './hooks/useGlobalShortcut';

export const App: React.FC = () => {
  // Query parameters for initial state support (e.g. ?state=action&intent=gmail)
  const queryParams = new URLSearchParams(window.location.search);
  const initialUrlState = (queryParams.get('state') as IslandState) || 'idle';
  const initialUrlIntent = (queryParams.get('intent') as ActionCardType) || 'gmail';

  const [state, setState] = useState<IslandState>(initialUrlState);
  const [intentType, setIntentType] = useState<ActionCardType>(initialUrlIntent);
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  
  const stateRef = useRef<IslandState>(state);
  stateRef.current = state;
  const intentRef = useRef<ActionCardType>(intentType);
  intentRef.current = intentType;
  const lastToggleTime = useRef(0);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  // Sync keyboard interactivity with OS Layer Shell / KWin
  const syncKeyboardInteractivity = useCallback((active: boolean) => {
    try {
      invoke('set_keyboard_interactivity', { interactive: active }).catch(() => {});
    } catch {
      // Ignored in standard browser preview
    }
  }, []);

  const showOverlay = useCallback(async () => {
    try {
      await invoke('show_window');
    } catch {
      // Ignored outside Tauri
    }
  }, []);

  const hideOverlay = useCallback(async () => {
    try {
      await invoke('hide_window');
    } catch {
      // Ignored outside Tauri
    }
  }, []);

  useEffect(() => {
    const isInteractive = state !== 'hidden';
    syncKeyboardInteractivity(isInteractive);

    if (isInteractive) {
      window.focus();
      // Focus invisible keyboard capture input if no other form input is active
      const timer = setTimeout(() => {
        window.focus();
        if (
          !(document.activeElement instanceof HTMLInputElement) &&
          !(document.activeElement instanceof HTMLTextAreaElement)
        ) {
          hiddenInputRef.current?.focus();
        }
      }, 30);
      return () => clearTimeout(timer);
    } else {
      // Immediately blur any active element in webview so OS compositor releases focus cleanly
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [state, syncKeyboardInteractivity]);

  // Hotkey toggle (Ctrl + Alt) - Instantaneous state trigger (0ms latency)
  const handleToggle = useCallback(async () => {
    const now = Date.now();
    if (now - lastToggleTime.current < 150) {
      return;
    }
    lastToggleTime.current = now;

    const current = stateRef.current;
    if (current === 'hidden') {
      await showOverlay();
      setState('idle');
    } else {
      syncKeyboardInteractivity(false);
      setState('hidden');
    }
  }, [showOverlay, syncKeyboardInteractivity]);

  // Click on the Notch top bar: Toggles between open and close, preserving exact intent & position
  const handleNotchClick = useCallback(() => {
    const current = stateRef.current;
    if (current === 'idle') {
      setState('action');
    } else if (current === 'listening') {
      setState('action');
    } else if (current === 'action') {
      setState('idle');
    } else if (current === 'success') {
      setState('idle');
    }
  }, []);

  // Dismissal when clicking outside while expanded: retracts to notch
  const handleBackdropClick = useCallback(() => {
    const current = stateRef.current;
    if (current === 'action' || current === 'listening' || current === 'success') {
      setState('idle');
    }
  }, []);

  // Action completion (user clicked Send in Gmail or Save in Calendar)
  const handleActionComplete = useCallback(() => {
    setState('success');
  }, []);

  // When success toast duration finishes:
  // Smoothly advances to next scenario and resets to idle
  const handleSuccessDismiss = useCallback(() => {
    const nextIntent: ActionCardType = intentRef.current === 'gmail' ? 'calendar' : 'gmail';
    setIntentType(nextIntent);
    setState('idle');
  }, []);

  const handleAnimationEnd = useCallback(async () => {
    if (stateRef.current === 'hidden') {
      await hideOverlay();
    }
  }, [hideOverlay]);

  // Global shortcut hook for Ctrl + Alt
  useGlobalShortcut({
    onToggle: handleToggle,
  });

  // Direct Keyboard Shortcuts:
  // 'Space' -> Expand / Retract Notch Action Card
  // '1' -> Gmail New Message Card
  // '2' -> Calendar New Event Card
  // 'd' or 'Tab' -> Auto Demo Mode
  // 'Escape' -> Retract / Dismiss to Bezel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isFormInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) &&
        target !== hiddenInputRef.current;

      // Don't intercept shortcut keys if user is intentionally typing inside Gmail/Calendar form inputs
      if (isFormInput) {
        if (e.key === 'Escape') {
          target.blur();
          setState('idle');
        }
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => (prev === 'action' ? 'idle' : 'action'));
      } else if (e.key === '1') {
        e.preventDefault();
        setIntentType('gmail');
        setState('action');
      } else if (e.key === '2') {
        e.preventDefault();
        setIntentType('calendar');
        setState('action');
      } else if (e.key.toLowerCase() === 'd' || e.key === 'Tab') {
        e.preventDefault();
        setIsAutoDemo((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsAutoDemo(false);
        setState('hidden');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  // Auto Demo Loop (Simulates the exact video flow when enabled)
  useEffect(() => {
    if (!isAutoDemo) return;

    let timer: NodeJS.Timeout;
    const runDemoStep = () => {
      const curState = stateRef.current;
      const curIntent = intentRef.current;

      if (curState === 'idle') {
        setState('listening');
        timer = setTimeout(() => {
          setState('action');
        }, 1200);
      } else if (curState === 'action') {
        timer = setTimeout(() => {
          setState('success');
        }, 2600);
      } else if (curState === 'success') {
        timer = setTimeout(() => {
          const next = curIntent === 'gmail' ? 'calendar' : 'gmail';
          setIntentType(next);
          setState('idle');
        }, 1800);
      }
    };

    const interval = setInterval(runDemoStep, 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isAutoDemo]);

  const isExpanded = state === 'action' || state === 'listening';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none font-sans">
      {/* Invisible auto-focus capture element to ensure zero-latency keyboard routing */}
      <input
        ref={hiddenInputRef}
        type="text"
        tabIndex={0}
        aria-hidden="true"
        className="fixed opacity-0 pointer-events-none w-1 h-1 top-0 left-1/2 -z-50"
      />

      {/* Backdrop overlay active only when dropdown card is expanded to retract back to notch on click */}
      {isExpanded && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-transparent z-30 cursor-default"
        />
      )}

      {/* The Multi-Surface Floating Notch Island */}
      <NotchContainer
        state={state}
        intentType={intentType}
        onNotchClick={handleNotchClick}
        onActionComplete={handleActionComplete}
        onSuccessDismiss={handleSuccessDismiss}
        onAnimationEnd={handleAnimationEnd}
      />
    </div>
  );
};

export default App;
