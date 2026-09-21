import React, { useState, useCallback, useRef, useEffect } from 'react';
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

  const showOverlay = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('show_window');
    } catch {
      // Ignored outside Tauri
    }
  };

  const hideOverlay = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('hide_window');
    } catch {
      // Ignored outside Tauri
    }
  };

  // Hotkey toggle (Ctrl + Alt)
  const handleToggle = useCallback(async () => {
    const now = Date.now();
    if (now - lastToggleTime.current < 250) {
      return;
    }
    lastToggleTime.current = now;

    const current = stateRef.current;
    if (current === 'hidden') {
      await showOverlay();
      setState('idle');
    } else {
      setState('hidden');
    }
  }, []);

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
  }, []);

  // Global shortcut hook for Ctrl + Alt
  useGlobalShortcut({
    onToggle: handleToggle,
  });

  // Direct Keyboard Shortcuts:
  // '1' -> Gmail New Message Card
  // '2' -> Calendar New Event Card
  // 'Space' -> Toggle Listening / Action
  // 'd' or 'Tab' -> Auto Demo Mode
  // 'Escape' -> Retract / Dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing inside an active input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key === 'Escape') {
          e.target.blur();
          setState('idle');
        }
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setIntentType('gmail');
        setState('action');
      } else if (e.key === '2') {
        e.preventDefault();
        setIntentType('calendar');
        setState('action');
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setState((prev) => {
          if (prev === 'idle') return 'action';
          if (prev === 'action') return 'idle';
          return 'idle';
        });
      } else if (e.key.toLowerCase() === 'd' || e.key === 'Tab') {
        e.preventDefault();
        setIsAutoDemo((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsAutoDemo(false);
        setState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
