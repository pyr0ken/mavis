# Implementation Plan: Floating Notch Overlay with Global Shortcut (Tauri 2.0)

**Feature Branch**: `001-tauri-notch-overlay`  
**Created**: 2026-09-20  
**Status**: Planned  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Technical Context

- **Application Architecture**: Desktop Floating Transparent Overlay (Tauri 2.0 Rust Core + React/TypeScript/Tailwind/GSAP Frontend).
- **Window Positioning**: Anchored at `top: 0, left: 50%` of Primary Display (`x: (primary_width - window_width) / 2, y: 0`).
- **Window Attributes**: `decorations: false`, `transparent: true`, `always_on_top: true`, `shadow: false`, `skip_taskbar: true`.
- **Global Shortcut System**: `tauri-plugin-global-shortcut` bound to `Ctrl + Alt + Enter` (with frontend `Escape` fallback listener).
- **Click-Through Behavior**: Dynamic cursor event pass-through via Rust command calling `window.set_ignore_cursor_events(true)` when collapsed and `false` when expanded.
- **Animation Engine**: GSAP with Apple Fluid Spring curve (`elastic.out(1, 0.8)` / `cubic-bezier(0.16, 1, 0.3, 1)`), morphing dimensions between Idle (`170x28px`) and Expanded (`440x110px`).

---

## 2. Constitution & Gate Checks

| Constitution Principle | Status | Compliance Details |
|---|---|---|
| **I. Fluid Spring Physics & Notch Morphing** | **PASS** | GSAP elastic morphing container with concave SVG corner fillets; <50ms trigger latency. |
| **II. Ultra-Lightweight Tauri 2.0 Architecture** | **PASS** | Tauri 2.0 Rust binary, <35MB RAM footprint, zero polling CPU overhead. |
| **III. Privacy-First Audio Capture** | **PASS** | Visual indicator dots and waveform placeholder; no background audio recording. |
| **IV. Structured Intent Execution** | **PASS** | State machine structured for seamless transition to Action Cards in Phase 2. |
| **V. Architectural Layering** | **PASS** | Clean separation of `src-tauri/` (native window/shortcut IPC) and `src/` (UI/animation). |
| **VI. Dark Elegance Aesthetics** | **PASS** | Frosted obsidian glass (`backdrop-filter: blur(32px)`), radiant edge glow, and crisp typography. |

---

## 3. Phase Breakdown

### Phase 0: Outline & Research (`research.md`)
- [x] Investigate Tauri 2.0 window positioning and primary display detection in Rust.
- [x] Determine exact `tauri-plugin-global-shortcut` registration patterns and IPC event broadcasting.
- [x] Validate cross-platform transparent window rendering and `set_ignore_cursor_events` behavior.
- [x] Establish GSAP spring timing and hardware-accelerated CSS transform strategies.

### Phase 1: Design & Contracts (`data-model.md`, `contracts/`, `quickstart.md`)
- [x] Document UI state machine and event payload structures in `data-model.md`.
- [x] Specify Tauri IPC commands and frontend event listeners in `contracts/tauri-ipc.md`.
- [x] Author comprehensive validation and development workflow in `quickstart.md`.

### Phase 2: Implementation Tasks (Next Step: `/speckit-tasks`)
- Task 1: Initialize Tauri 2.0 project skeleton with Vite, React 19, TypeScript, and Tailwind CSS.
- Task 2: Configure `src-tauri/tauri.conf.json` with transparent frameless window specifications.
- Task 3: Implement Rust native layer with global shortcut listener and window state toggle IPC.
- Task 4: Build React notch component with SVG concave fillets and GSAP spring animations.
- Task 5: Implement click-outside blur detection and click-through cursor event management.
- Task 6: Validate end-to-end performance (<35MB RAM, 60+ FPS animation, <50ms hotkey toggle).

---

## 4. Deliverables & File Mapping

```
mavis/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   └── src/
│       ├── main.rs
│       └── lib.rs
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── NotchContainer.tsx
│   │   ├── ConcaveShoulders.tsx
│   │   ├── AudioWaveformBars.tsx
│   │   └── GlowRing.tsx
│   └── hooks/
│       ├── useGlobalShortcut.ts
│       └── useIslandAnimation.ts
├── specs/001-tauri-notch-overlay/
│   ├── spec.md
│   ├── plan.md
│   ├── research.md
│   ├── data-model.md
│   ├── contracts/
│   │   └── tauri-ipc.md
│   └── quickstart.md
└── package.json
```
