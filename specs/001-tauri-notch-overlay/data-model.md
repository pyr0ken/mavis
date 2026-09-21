# Data Model & State Transitions: Floating Notch Overlay

**Feature Branch**: `001-tauri-notch-overlay`  
**Status**: Completed

---

## 1. Core State Entities

### `IslandState` (Enum)
Represents the current visual and operational mode of the dynamic notch container.

```typescript
export type IslandState = 'idle' | 'listening' | 'action' | 'success';
```

- **`idle`**: Notch is docked at top bezel (`170px x 28px`), compact camera/globe indicator, click-through enabled on outer bounds.
- **`listening`**: Expanded container (`440px x 110px`), glowing aura active, animated waveform bars, live speech transcription placeholder.
- **`action`**: Structured action card view (`460px x 195px`, e.g., Gmail Compose, Calendar Scheduler) for Phase 2.
- **`success`**: Compact floating HUD confirmation toast (`165px x 38px`, e.g., "Email sent ✓").

---

### `IslandGeometry` (Value Object)
Defines the dimensional boundaries and CSS radii for each state.

```typescript
export interface IslandGeometry {
  width: number;
  height: number;
  borderRadius: string;
  duration: number; // in seconds
  ease: string;     // GSAP ease curve
}

export const STATE_GEOMETRIES: Record<IslandState, IslandGeometry> = {
  idle: {
    width: 170,
    height: 28,
    borderRadius: '0 0 14px 14px',
    duration: 0.45,
    ease: 'power4.inOut'
  },
  listening: {
    width: 440,
    height: 110,
    borderRadius: '0 0 22px 22px',
    duration: 0.50,
    ease: 'elastic.out(1, 0.8)'
  },
  action: {
    width: 460,
    height: 195,
    borderRadius: '0 0 24px 24px',
    duration: 0.55,
    ease: 'elastic.out(1, 0.75)'
  },
  success: {
    width: 165,
    height: 38,
    borderRadius: '0 0 16px 16px',
    duration: 0.40,
    ease: 'elastic.out(1, 0.85)'
  }
};
```

---

### `WindowOverlayState` (Rust / Native IPC)
Represents the operating system level window parameters managed by Tauri.

```typescript
export interface WindowOverlayState {
  isOpen: boolean;
  ignoreCursorEvents: boolean;
  primaryMonitorWidth: number;
  primaryMonitorHeight: number;
  windowX: number;
  windowY: number;
}
```

---

## 2. State Transition Matrix

| Current State | Trigger Event | Next State | Window Action | Animation Ease |
|---|---|---|---|---|
| `idle` | `Ctrl+Alt+Enter` (Global Hotkey) | `listening` | `set_ignore_cursor_events(false)` | `elastic.out(1, 0.8)` |
| `listening` | `Ctrl+Alt+Enter` (Global Hotkey) | `idle` | `set_ignore_cursor_events(true)` | `power4.inOut` |
| `listening` | `Escape` Key Pressed | `idle` | `set_ignore_cursor_events(true)` | `power4.inOut` |
| `listening` | Outside Backdrop Click / Blur | `idle` | `set_ignore_cursor_events(true)` | `power4.inOut` |
| `listening` | Voice Command Resolved | `action` | Maintain active cursor focus | `elastic.out(1, 0.75)` |
| `action` | Action Executed / Confirmed | `success` | Auto-trigger timer to `idle` | `elastic.out(1, 0.85)` |
| `success` | Timeout (2.0s) | `idle` | `set_ignore_cursor_events(true)` | `power4.inOut` |
