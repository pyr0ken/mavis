# Data Model: KRunner-Style System-Level Omnipresent Desktop Overlay

**Feature Directory**: `specs/003-krunner-system-overlay`  
**Created**: 2026-09-21  
**Status**: Ready  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Window & Workspace Entity Models

### 1.1 `SystemOverlayWindowConfig`
Represents the native window configuration applied at runtime by the Tauri 2.0 Rust core.

| Field | Type | Description | Default |
|:---|:---|:---|:---|
| `label` | `String` | Window identifier handle | `"main"` |
| `title` | `String` | Window title / class identifier | `"voice-island"` |
| `app_id` | `String` | Wayland application ID / WM class | `"voice-island"` |
| `width` | `f64` | Native window canvas width | `1100.0` |
| `height` | `f64` | Native window canvas height | `720.0` |
| `always_on_top` | `bool` | Keep window above standard app windows | `true` |
| `visible_on_all_workspaces` | `bool` | Pin window across all virtual desktops | `true` |
| `skip_taskbar` | `bool` | Hide from taskbar, dock, and pagers | `true` |
| `decorations` | `bool` | Window borders and titlebar | `false` |
| `transparent` | `bool` | Alpha transparency enabled | `true` |
| `shadow` | `bool` | OS window drop shadow | `false` |
| `resizable` | `bool` | User resizability | `false` |

---

### 1.2 `OverlayLifecycleState`
Enum representing the runtime lifecycle states of the system-level overlay.

```typescript
export type OverlayLifecycleState = 
  | "DAEMON_IDLE"        // Collapsed/hidden notch, click-through active, sticky on all desktops
  | "ACTIVE_LISTENING"   // Expanded notch, mic FFT active, capturing voice & key input
  | "ACTION_CARD_OPEN"   // Cascading dropdown card (Gmail/Calendar), form fields editable
  | "SUCCESS_TOAST"      // Floating confirmation capsule pill, auto-retract timer running
  | "RETRACTING";        // Spring retract animation in progress, releasing focus
```

---

### 1.3 `DesktopWorkspaceContext`
Represents the runtime state during multi-workspace transitions.

```typescript
export interface DesktopWorkspaceContext {
  primaryMonitor: {
    width: number;
    height: number;
    scaleFactor: number;
  };
  isStickyAllDesktops: boolean;
  isAlwaysOnTop: boolean;
  clickThroughEnabled: boolean;
  currentLifecycleState: OverlayLifecycleState;
  activeIntentType: "NONE" | "GMAIL_COMPOSE" | "CALENDAR_EVENT" | "VOICE_STREAM";
}
```

---

## 2. State Machine Transitions

```
                    ┌─────────────────────────┐
                    │       DAEMON_IDLE       │
                    │ - Sticky on all desktops│
                    │ - Click-through: TRUE   │
                    │ - Taskbar: HIDDEN       │
                    └─────────────────────────┘
                                 │
                 [Global Hotkey / Ctrl+Alt]
                                 ▼
                    ┌─────────────────────────┐
                    │    ACTIVE_LISTENING     │
                    │ - Top notch expanded    │
                    │ - Mic FFT active        │
                    │ - Click-through: FALSE  │
                    │ - Keyboard focus: GRAB  │
                    └─────────────────────────┘
                                 │
                     [Voice Intent Resolved]
                                 ▼
                    ┌─────────────────────────┐
                    │    ACTION_CARD_OPEN     │
                    │ - Dropdown modal open   │
                    │ - Gmail / Calendar Card │
                    │ - Persistent on Desktop │
                    │   Switching             │
                    └─────────────────────────┘
                                 │
                   [Click Send/Save / Enter]
                                 ▼
                    ┌─────────────────────────┐
                    │      SUCCESS_TOAST      │
                    │ - Compact pill capsule  │
                    │ - Auto-retract: 1.8s    │
                    └─────────────────────────┘
                                 │
                  [Timer Expired / Esc / Blur]
                                 ▼
                    ┌─────────────────────────┐
                    │       RETRACTING        │
                    │ - Spring retract motion │
                    │ - Focus released to OS  │
                    │ - Click-through restored│
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       DAEMON_IDLE       │
                    └─────────────────────────┘
```

---

## 3. Validation & Invariants

1. **Workspace Persistence Invariant**: The window MUST remain pinned to all workspaces across every state transition (`visible_on_all_workspaces == true`).
2. **Focus Release Invariant**: When transitioning to `RETRACTING` or `DAEMON_IDLE`, window focus MUST be cleanly released so background applications resume uninterrupted typing.
3. **Click-Through Invariant**: Transparent window bounds outside the visible notch container MUST allow mouse clicks to pass through directly to background windows when idle.
