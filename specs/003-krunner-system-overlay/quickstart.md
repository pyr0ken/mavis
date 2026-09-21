# Quickstart Validation Guide: KRunner-Style System-Level Omnipresent Desktop Overlay

**Feature Directory**: `specs/003-krunner-system-overlay`  
**Created**: 2026-09-21  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Prerequisites

- **Host Environment**: Linux (Arch Linux / KDE Plasma Wayland or X11) / macOS / Windows.
- **Node.js**: v20+ with npm.
- **Rust Toolchain**: `rustc` / `cargo` 1.80+.
- **Tauri 2.0 CLI**: Pre-installed via project dependencies.

---

## 2. Setup & Development Server

From the repository root (`/home/omid/Code/ai/voice-island`):

```bash
# 1. Install frontend dependencies
npm install

# 2. Start Vite frontend & Tauri 2.0 native development environment
npm run tauri dev
```

---

## 3. Step-by-Step Validation Scenarios

### Scenario A: Multi-Workspace Persistence (Sticky Across Desktops)
1. Launch the Tauri application (`npm run tauri dev`).
2. Open the floating overlay with `Ctrl + Alt` (or click on the notch).
3. Switch virtual desktops in KDE Plasma (e.g. `Ctrl + F1`, `Ctrl + F2`, or touchpad 4-finger swipe).
4. **Assert**: The Voice Island top notch remains perfectly anchored at top-center on the new virtual desktop without flickering or disappearing.

### Scenario B: Active Voice/Card State Continuity
1. Trigger the Gmail or Calendar Action Card (Hotkey `1` or `2`).
2. While the card is open and typewriter text is streaming, switch between 3 different virtual desktops.
3. **Assert**: The card content, typewriter animation, and interactive buttons remain active and fully editable across all desktops.

### Scenario C: Taskbar & Alt+Tab Exclusion
1. With Voice Island running, open the system task manager / panel dock.
2. Press `Alt + Tab` repeatedly to cycle through open applications.
3. **Assert**: Voice Island does NOT appear as a standard application window or taskbar tile.

### Scenario D: Click-Through & Outside Blur Dismissal
1. While the notch is in idle/collapsed mode, click a browser tab or menu bar directly underneath the transparent window bounds.
2. **Assert**: Clicks are received cleanly by the background application.
3. Open the overlay, then click anywhere on the background desktop or press `Escape`.
4. **Assert**: The overlay retracts smoothly to the top bezel and restores cursor pass-through.
