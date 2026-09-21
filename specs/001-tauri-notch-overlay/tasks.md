# Tasks: Floating Notch Overlay with Global Shortcut (Tauri 2.0)

**Feature Branch**: `001-tauri-notch-overlay`  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Dependency Graph & Implementation Strategy

```
Phase 1: Project Setup (T001-T004) [COMPLETED]
        │
        ▼
Phase 2: Foundational Types & Native Configuration (T005-T008) [COMPLETED]
        │
        ├─────────────────────────────────────────┐
        ▼                                         ▼
Phase 3: US1 - Global Shortcut (T009-T012)    Phase 4: US2 - Spring Animation & Shoulders (T013-T016) [COMPLETED]
        │                                         │
        └───────────────────┬─────────────────────┘
                            ▼
Phase 5: US3 - Transparent Overlay & Click-through (T017-T020) [COMPLETED]
                            │
                            ▼
Phase 6: US4 - Visual Indicator & Waveform Placeholder (T021-T023) [COMPLETED]
                            │
                            ▼
Phase 7: Polish, Performance Audit & Verification (T024-T027) [COMPLETED]
```

---

## Phase 1: Setup & Project Initialization

- [x] T001 Initialize Tauri 2.0 + React 19 + TypeScript project structure in `package.json` and `src-tauri/Cargo.toml`
- [x] T002 [P] Configure Vite, Tailwind CSS v3, and PostCSS in `vite.config.ts` and `tailwind.config.js`
- [x] T003 [P] Install frontend dependencies (`gsap`, `lucide-react`, `clsx`, `tailwind-merge`, `@tauri-apps/api`, `@tauri-apps/plugin-global-shortcut`) in `package.json`
- [x] T004 [P] Create HTML template and root mounting point in `index.html` and `src/main.tsx`

---

## Phase 2: Foundational Architecture & Types

- [x] T005 [P] Define core island types (`IslandState`, `IslandGeometry`, `STATE_GEOMETRIES`) in `src/types/island.ts`
- [x] T006 Configure transparent, frameless, always-on-top window envelope (`width: 600, height: 260, transparent: true, decorations: false, alwaysOnTop: true`) in `src-tauri/tauri.conf.json`
- [x] T007 Configure Tauri 2.0 capabilities and permissions in `src-tauri/capabilities/default.json`
- [x] T008 [P] Setup base dark theme styling, root background reset, and glassmorphism utilities in `src/index.css`

---

## Phase 3: User Story 1 - Global Shortcut Activation & Dismissal [P1]

- [x] T009 [US1] Implement global shortcut listener for `Ctrl+Alt+Enter` with event broadcast in `src-tauri/src/lib.rs`
- [x] T010 [P] [US1] Create `useGlobalShortcut` hook listening for Tauri event `global-shortcut-triggered` and window `Escape` key in `src/hooks/useGlobalShortcut.ts`
- [x] T011 [US1] Implement primary display centering logic (`center_top_window`) in `src-tauri/src/lib.rs`
- [x] T012 [US1] Wire global shortcut hook to state controller in `src/App.tsx`

---

## Phase 4: User Story 2 - Fluid Spring Morphing Animation & Concave Shoulders [P1]

- [x] T013 [P] [US2] Create concave SVG shoulder components (`ConcaveShoulders`) with inverted corner radii in `src/components/ConcaveShoulders.tsx`
- [x] T014 [P] [US2] Implement GSAP spring animation hook (`useIslandAnimation`) with elastic morphing curve in `src/hooks/useIslandAnimation.ts`
- [x] T015 [US2] Build morphing island container component (`NotchContainer`) with frosted acrylic backdrop in `src/components/NotchContainer.tsx`
- [x] T016 [US2] Integrate concave shoulders and spring animations inside `src/App.tsx`

---

## Phase 5: User Story 3 - Transparent Window & Non-Intrusive Click Handling [P1]

- [x] T017 [US3] Implement `set_ignore_cursor_events` native Tauri command in `src-tauri/src/lib.rs`
- [x] T018 [US3] Create transparent backdrop overlay with outside-click dismiss handler in `src/App.tsx`
- [x] T019 [US3] Connect island state transitions to `set_ignore_cursor_events` invocation in `src/hooks/useIslandAnimation.ts`
- [x] T020 [US3] Implement window blur listener for auto-dismissal in `src/hooks/useGlobalShortcut.ts`

---

## Phase 6: User Story 4 - Visual State Indicator & Minimal Voice Placeholder [P2]

- [x] T021 [P] [US4] Create multicolor rotating ambient glow ring component (`GlowRing`) in `src/components/GlowRing.tsx`
- [x] T022 [P] [US4] Build dynamic audio waveform bar visualizer component (`AudioWaveformBars`) in `src/components/AudioWaveformBars.tsx`
- [x] T023 [US4] Implement active listening card with mic badge and typing prompt placeholder in `src/components/ListeningView.tsx`

---

## Phase 7: Polish, Performance Audit & Quality Verification

- [x] T024 Perform memory and CPU audit to verify idle RAM is strictly < 35MB and idle CPU is < 0.1%
- [x] T025 Verify frame-rate consistency (60+ FPS) during consecutive `Ctrl + Alt + Enter` toggles
- [x] T026 [P] Add build configuration and verified `npm run build` and `cargo check` compile successfully
- [x] T027 Validate against all acceptance scenarios in `specs/001-tauri-notch-overlay/quickstart.md`
