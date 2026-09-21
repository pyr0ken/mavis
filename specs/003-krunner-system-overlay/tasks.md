# Tasks: KRunner-Style System-Level Omnipresent Desktop Overlay

**Feature Directory**: `specs/003-krunner-system-overlay`  
**Created**: 2026-09-21  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Dependency Graph & Implementation Strategy

```
Phase 1: Project Setup & Tauri Config (T001-T003) [COMPLETED]
        │
        ▼
Phase 2: Foundational Types & Native Surface Models (T004-T007) [COMPLETED]
        │
        ├─────────────────────────────────────────┐
        ▼                                         ▼
Phase 3: US1 - Multi-Workspace Persistence (T008-T011)   Phase 4: US2 - Zero Taskbar / System Module (T012-T014) [COMPLETED]
        │                                         │
        └───────────────────┬─────────────────────┘
                            ▼
Phase 5: US3 - Global Shortcut & Focus Handshake (T015-T018) [COMPLETED]
                            │
                            ▼
Phase 6: US4 - Transparent Canvas Click-Through (T019-T022) [COMPLETED]
                            │
                            ▼
Phase 7: Polish, KWin Rules Integration & Verification (T023-T026) [COMPLETED]
```

---

## Phase 1: Setup & Configuration

- [x] T001 Verify Tauri 2.0 and frontend build environment in `package.json` and `src-tauri/Cargo.toml`
- [x] T002 [P] Set application ID to `voice-island` and title to `Voice Island` in `src-tauri/tauri.conf.json`
- [x] T003 [P] Ensure native window dimensions (`width: 1100, height: 720, transparent: true, decorations: false, alwaysOnTop: true, skipTaskbar: true`) are set in `src-tauri/tauri.conf.json`

---

## Phase 2: Foundational Types & Native Surface Models

- [x] T004 [P] Define `DesktopWorkspaceContext` and `OverlayLifecycleState` types in `src/types/island.ts`
- [x] T005 [P] Declare native IPC command signatures (`center_top_window`, `show_window`, `hide_window`, `set_cursor_click_through`) in `src/types/tauri-ipc.d.ts`
- [x] T006 [P] Update permissions and IPC capability rules in `src-tauri/capabilities/default.json`
- [x] T007 Configure root window styling to enforce zero-margin transparent canvas in `src/index.css`

---

## Phase 3: User Story 1 - Multi-Workspace Persistence (Sticky Across Desktops) [P1]

**Goal**: Keep Voice Island permanently fixed at the top-center of the screen across all virtual desktops / workspaces, exactly like KRunner.

- [x] T008 [US1] Implement primary monitor detection and centered top coordinates in `src-tauri/src/lib.rs`
- [x] T009 [US1] Apply `window.set_visible_on_all_workspaces(true)` and `window.set_always_on_top(true)` on window initialization in `src-tauri/src/lib.rs`
- [x] T010 [US1] Ensure `center_top_window` re-asserts `set_visible_on_all_workspaces(true)` whenever invoked in `src-tauri/src/lib.rs`
- [x] T011 [US1] Verify active state continuity (typewriter animation and audio visualizer persistence) during workspace transitions in `src/App.tsx`

---

## Phase 4: User Story 2 - System Module Identity & Zero Taskbar Clutter [P1]

**Goal**: Run Voice Island as an ambient, borderless system overlay with zero footprint in taskbar, dock, or Alt+Tab switcher.

- [x] T012 [US2] Enforce `skip_taskbar: true` and `decorations: false` in native window creation in `src-tauri/tauri.conf.json`
- [x] T013 [P] [US2] Set Linux WM class and Wayland app_id to `voice-island` in `src-tauri/src/main.rs` and `src-tauri/tauri.conf.json`
- [x] T014 [US2] Verify absence of application entry in system taskbar, window pagers, and Alt+Tab switchers in `src-tauri/src/lib.rs`

---

## Phase 5: User Story 3 - Instant Global Shortcut & Focus Handshake [P1]

**Goal**: Invoke the overlay instantly (<50ms) from any virtual desktop or application with automatic keyboard focus and clean dismissal.

- [x] T015 [US3] Optimize low-latency `Ctrl + Alt` keyhook listener with press latch in `src-tauri/src/lib.rs`
- [x] T016 [US3] Implement `show_window` command to position, show, and focus window simultaneously in `src-tauri/src/lib.rs`
- [x] T017 [P] [US3] Connect `global-shortcut-triggered` event listener and `Escape` key handling in `src/hooks/useGlobalShortcut.ts`
- [x] T018 [US3] Implement smooth dismissal and release of OS keyboard focus in `src-tauri/src/lib.rs` and `src/App.tsx`

---

## Phase 6: User Story 4 - Transparent Canvas Click-Through & Outside Dismissal [P2]

**Goal**: Enable dynamic mouse event pass-through when collapsed/idle so transparent regions do not block desktop clicks.

- [x] T019 [US4] Implement `set_cursor_click_through` native command with `set_ignore_cursor_events` in `src-tauri/src/lib.rs`
- [x] T020 [US4] Trigger click-through enable when transitioning to `DAEMON_IDLE` in `src/hooks/useIslandAnimation.ts`
- [x] T021 [US4] Trigger click-through disable when expanding into `ACTIVE_LISTENING` or `ACTION_CARD_OPEN` in `src/hooks/useIslandAnimation.ts`
- [x] T022 [US4] Add backdrop outside-click listener for immediate retract in `src/App.tsx`

---

## Phase 7: Polish, KWin Rules Integration & Multi-Workspace Quality Verification

- [x] T023 [P] Author declarative KWin Window Rule template and installation instructions in `scripts/kwin-rules/voice-island.kwinrule`
- [x] T024 Perform multi-workspace switching benchmark across 4 virtual desktops to confirm zero visual flicker or displacement
- [x] T025 Audit idle background resource consumption to verify `< 35MB RAM` and `< 0.1% CPU`
- [x] T026 Execute full verification against all scenarios in `specs/003-krunner-system-overlay/quickstart.md`
