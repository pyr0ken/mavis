# Technical Research: KRunner-Style System-Level Omnipresent Desktop Overlay

**Feature Directory**: `specs/003-krunner-system-overlay`  
**Created**: 2026-09-21  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Multi-Workspace Persistence & Sticky Overlay Architecture

### Problem Statement
Standard application windows in Linux (X11 / Wayland) and other operating systems are bound to a specific virtual desktop / workspace. When a user switches desktops via gestures or hotkeys, normal windows slide out of view. In contrast, system modules like **KRunner** act as persistent viewports attached directly to the compositor's overlay layer across all virtual desktops.

### Decision: Multi-Tier Sticky Window Protocol
We implement a robust, multi-tier window strategy in Tauri 2.0 / Rust:
1. **Tier 1 (Rust Native Tauri API)**:
   - `window.set_visible_on_all_workspaces(true)`: Tells the underlying window manager (via X11 `_NET_WM_DESKTOP = 0xFFFFFFFF` / macOS NSWindowCollectionBehaviorCanJoinAllSpaces / Windows VirtualDesktopManager) that this window belongs to all virtual desktops.
   - `window.set_always_on_top(true)`: Keeps the window above standard application windows.
   - `window.set_skip_taskbar(true)`: Removes the window from taskbars, docks, and panel pagers.
2. **Tier 2 (KWin Rules & Stable Window Identification)**:
   - Setting a deterministic application ID (`voice-island`) and window class (`wm_class: "voice-island"`).
   - Providing automated or declarative KWin Window Rule compatibility for KDE Plasma Wayland sessions where compositors enforce strict workspace isolation.
3. **Tier 3 (State Continuity Across Desktops)**:
   - Ensuring that ongoing voice input, FFT audio visualization, and active Action Cards do not pause or drop state when a workspace switch event occurs.

### Alternatives Considered
- **Spawning a separate window per virtual desktop**: Rejected due to high memory overhead, audio stream concurrency issues, and inconsistent state sync.
- **Pure Web-based widget**: Rejected because browser windows lack root compositor permissions to span across virtual desktops without window borders.

---

## 2. Window Level & Compositor Layer Integration (KDE Plasma / Wayland / X11)

### Problem Statement
Under KDE Plasma Wayland, standard top-level windows (`xdg_toplevel`) can be constrained by compositor security policies regarding absolute screen positioning and focus stealing.

### Decision: Dedicated System Overlay Surface Profile
- Window geometry: Anchored to Primary Monitor (`x: (screen_width - 1100) / 2, y: 0, width: 1100, height: 720`).
- Window attributes: `transparent: true`, `decorations: false`, `shadow: false`, `resizable: false`, `always_on_top: true`, `skip_taskbar: true`.
- Dynamic Cursor Pass-Through: `set_ignore_cursor_events(true)` when idle/retracted, allowing full interaction with background applications, and `false` when active.

---

## 3. Global Shortcut Daemon & Focus Management

### Problem Statement
When invoked from any desktop, the assistant must pop up instantly (<50ms) without locking the user's cursor or leaving dangling focus traps.

### Decision: Low-Latency Keyhook Listener with Clean Focus Handshake
- **Global Keyhook**: Dual Ctrl+Alt latch listener running on a dedicated Rust background thread (`rdev` / OS keyhook).
- **Focus Lifecycle**:
  - `Show`: Window is positioned at top-center, set to visible on all workspaces, brought to front, and focused for input.
  - `Dismiss (Escape / Outside Click)`: Window smoothly animates closed, releases keyboard focus back to the previously active OS application, and re-enables cursor pass-through.

---

## 4. Resource & Performance Constraints

- **Idle RAM Budget**: Strictly `< 35MB RAM`.
- **Idle CPU**: `< 0.1% CPU`.
- **Hotkey Response Latency**: `< 50ms` from hardware keystroke to visual spring initiation.
- **Workspace Switch Render Frame Rate**: Solid 60 / 120 FPS with zero layout jitter.
