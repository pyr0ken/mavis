# Implementation Plan: KRunner-Style System-Level Omnipresent Desktop Overlay

**Feature Directory**: `specs/003-krunner-system-overlay`  
**Created**: 2026-09-21  
**Status**: Ready for Tasks (`/speckit-tasks`)  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Technical Context

- **Application Architecture**: System-Level Ambient Desktop HUD (Tauri 2.0 Rust Native Core + React 19 / TypeScript / Tailwind CSS / GSAP Frontend).
- **Workspace Model**: Omnipresent Sticky Window (`visible_on_all_workspaces = true`), persisting across all virtual desktops/workspaces on Linux (KDE Plasma / Wayland / X11).
- **Window Layering & Geometry**: `width: 1100px, height: 720px`, anchored at `top: 0, left: 50%` of Primary Display (`x: (primary_width - 1100) / 2, y: 0`), `always_on_top: true`, `skip_taskbar: true`, `decorations: false`, `transparent: true`.
- **System Integration**: Low-latency background keyhook listener (`Ctrl + Alt` latch) with immediate window presentation and sub-50ms activation latency.
- **Click-Through Handling**: Dynamic cursor event pass-through via native Rust IPC commands when idle/collapsed, full pointer capture when expanded.

---

## 2. Constitution & Gate Checks

| Constitution Principle | Status | Compliance Details |
|:---|:---|:---|
| **I. Fluid Spring Physics & Notch Morphing** | **PASS** | Hardware notch alignment (`top: 0, left: 50%`) with concave SVG fillets and GSAP spring animations across all virtual desktops. |
| **II. Ultra-Lightweight Tauri 2.0 Architecture** | **PASS** | Frameless, transparent, sticky window configuration with `< 35MB RAM` idle footprint and `< 0.1% CPU`. |
| **III. Privacy-First Audio Capture** | **PASS** | Explicit user-triggered listening state with prominent visual indicators and zero unprompted background audio recording. |
| **IV. Structured Intent Execution** | **PASS** | Full support for interactive Action Cards (Gmail composer, Calendar event) persisting continuously during workspace transitions. |
| **V. Architectural Layering** | **PASS** | Clean separation of `src-tauri/` (Rust native window & workspace management) and `src/` (React UI & animation components). |
| **VI. Dark Elegance Aesthetics** | **PASS** | Frosted obsidian glass (`#16181F`), Apple Intelligence cyan/blue perimeter glow, and high-contrast typography. |

---

## 3. Phase Breakdown

### Phase 0: Outline & Research (`research.md`)
- [x] Researched multi-workspace persistence via `set_visible_on_all_workspaces(true)` and KWin rules.
- [x] Analyzed KDE Plasma Wayland layer behavior, window classes, and primary monitor anchoring.
- [x] Established low-latency global shortcut daemon and focus lifecycle management.

### Phase 1: Design & Contracts (`data-model.md`, `contracts/`, `quickstart.md`)
- [x] Defined `SystemOverlayWindowConfig`, `OverlayLifecycleState`, and `DesktopWorkspaceContext` in `data-model.md`.
- [x] Specified Tauri IPC commands (`center_top_window`, `show_window`, `hide_window`, `set_cursor_click_through`) and KWin rule contracts in `contracts/system-overlay-contract.md`.
- [x] Authored end-to-end multi-workspace verification scenarios in `quickstart.md`.

### Phase 2: Implementation Tasks (Next Step: `/speckit-tasks`)
- Task 1: Update `src-tauri/tauri.conf.json` with strict system overlay window properties (`app_id: "voice-island"`, `skipTaskbar: true`, `alwaysOnTop: true`, `visible: false`).
- Task 2: Enhance `src-tauri/src/lib.rs` with multi-monitor primary detection, `set_visible_on_all_workspaces(true)`, and click-through IPC command handlers.
- Task 3: Implement frontend focus handshake and outside-blur dismissal in `src/hooks/useGlobalShortcut.ts` and `src/App.tsx`.
- Task 4: Provide declarative KWin Window Rule template and setup script for KDE Plasma desktop environments.
- Task 5: Validate multi-workspace persistence, state continuity, and performance metrics.

---

## 4. Deliverables & File Mapping

```
voice-island/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       └── lib.rs
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── NotchContainer.tsx
│   │   ├── DropdownCard.tsx
│   │   └── ...
│   └── hooks/
│       └── useGlobalShortcut.ts
└── specs/003-krunner-system-overlay/
    ├── spec.md
    ├── checklists/
    │   └── requirements.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── contracts/
    │   └── system-overlay-contract.md
    └── quickstart.md
```
