# Research & Architectural Decisions: Floating Notch Overlay

**Feature Branch**: `001-tauri-notch-overlay`  
**Status**: Completed

---

## 1. Desktop Framework & Runtime Choice

- **Decision**: **Tauri 2.0** with Rust backend and Vite/React/Tailwind frontend.
- **Rationale**: 
  - **Memory Footprint**: Tauri idle RAM is ~18–30MB compared to 150–250MB+ for Electron.
  - **Instant Startup**: Native Rust binary has sub-50ms cold-start latency.
  - **Modular Plugins**: Tauri 2.0 introduces official decoupled plugins (`global-shortcut`, `autostart`, `positioner`).
  - **Platform Native**: Utilizes OS webviews (WebKit on macOS/Linux, WebView2 on Windows) without bundling Chromium.
- **Alternatives Considered**:
  - *Electron*: Rejected due to high memory overhead and heavy idle battery consumption on laptops.
  - *Pure SwiftUI/AppKit*: Highly performant on macOS, but zero cross-platform capability on Linux (Arch) and Windows.

---

## 2. Transparent Window Positioning & Geometry

- **Decision**: Fixed top-center overlay window (`width: 600px, height: 260px`) placed at coordinates `(primary_display_width - 600) / 2, y: 0`.
- **Rationale**:
  - The OS-level window dimensions remain fixed at the maximum expanded envelope (`600x260px`), while the visible rendered HTML element (`#island-container`) morphs smoothly inside it from `170x28px` to `440x110px`.
  - Keeping the native OS window fixed eliminates flickering, window-resizing stutter, and OS compositor lag during fast spring animations.
- **Alternatives Considered**:
  - *Resizing the native OS window on every animation frame*: Strongly rejected due to heavy OS compositor lag, stuttering on X11/Wayland, and window manager jitter.

---

## 3. Global Shortcut Architecture

- **Decision**: Use `@tauri-apps/plugin-global-shortcut` in Rust core to register `Ctrl+Alt+Enter` with an event emit to the frontend `window.emit('toggle-island')`.
- **Rationale**:
  - Native OS keyhooks capture key combinations even when other applications (terminals, IDEs, games) have exclusive focus.
  - The frontend also listens for local `Escape` key events to provide instant local dismissal.
- **Alternatives Considered**:
  - *X11/Wayland specific keygrabbers*: Non-portable and brittle compared to Tauri's unified cross-platform shortcut plugin.

---

## 4. Cursor Events & Click-through Pass

- **Decision**: Dynamic pointer event management via `app_handle.get_webview_window("main").unwrap().set_ignore_cursor_events(bool)`.
- **Rationale**:
  - When the notch is **Closed/Idle**, `set_ignore_cursor_events(true)` ensures that all clicks passing through the transparent window hit the background applications underneath.
  - When the notch is **Open/Expanded**, `set_ignore_cursor_events(false)` is activated so the user can click buttons, toggle microphones, and interact with the card.
  - An outside transparent backdrop element detects clicks outside the island to trigger the retraction animation.
- **Alternatives Considered**:
  - *CSS pointer-events: none alone*: Fails at the OS window manager level because the transparent OS window still intercepts mouse focus unless native ignore cursor events is set.

---

## 5. Animation Physics & Rendering Engine

- **Decision**: **GSAP (GreenSock) 3.x** utilizing elastic spring easing (`elastic.out(1, 0.8)`) with hardware-accelerated CSS properties (`transform`, `width`, `height`, `borderRadius`).
- **Rationale**:
  - GSAP provides microsecond-accurate frame interpolation, interruption handling (if a user rapidly toggles hotkeys), and fluid cubic/elastic easing matching Apple HIG standards.
  - Tailwind CSS provides atomic utility classes for frosted glass vibrancy (`backdrop-blur-3xl`, `bg-black/90`, `border-white/10`).
- **Alternatives Considered**:
  - *Standard CSS Transitions*: Lack fluid elastic bounce curves and suffer from easing clipping when interrupted mid-flight.
