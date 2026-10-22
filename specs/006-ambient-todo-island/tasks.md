# Tasks: Ambient Todo Island & Keyboard-Driven Action Card

**Feature**: `specs/006-ambient-todo-island`  
**Date**: 2026-10-04  
**Status**: Completed  

---

## Phase 1: Setup & Foundational Infrastructure

- [x] T001 Define core Todo types, priorities, and interfaces in `src/types/todo.ts` (`TodoItem`, `TodoStatus`, `TodoPriority`, `TodoFilter`, `TodoStorageState`).
- [x] T002 Implement local reactive storage engine and natural token parser in `src/services/todo/todoStorageService.ts` (CRUD, `subscribe`, `parseInput` with `#tag` and `p1/p2/p3`, single `in_progress` invariant, timer utilities).
- [x] T003 Update `src/types/island.ts` to include `'todo'` in `ActionCardType`.

---

## Phase 2: User Story 2 & 3 - Keyboard-Driven Action Card & Quick Natural Input (Priority: P1)

- [x] T004 [US2/US3] Create `src/components/TodoListCard.tsx` with Linear/Raycast dark obsidian styling, top natural language quick input, filter pills (`All`, `Active`, `Doing`, `Done`, `P1`), and item rows.
- [x] T005 [US2] Implement comprehensive keyboard navigation in `src/components/TodoListCard.tsx`:
  - `j` / `Down` and `k` / `Up` to navigate active row
  - `Space` to toggle done/undone
  - `Enter` / `d` to toggle `in_progress` (Now Doing)
  - `1`, `2`, `3`, `0` to set priority
  - `Delete` / `Backspace` to delete
  - `Escape` to close
- [x] T006 [US3] Wire token parser and instant submission in the top quick input field (`Enter` creates task with priority and tags).

---

## Phase 3: User Story 1 - Ambient Notch "Now Doing" (Live Activity) (Priority: P1)

- [x] T007 [US1] Create `src/components/AmbientNowDoing.tsx` with pulsing amber/cyan target aura, active task title, live ticking elapsed time (`[14m]`), and one-click quick complete check button.
- [x] T008 [US1] Integrate `AmbientNowDoing` into `src/components/NotchContainer.tsx` top idle bar when a task has status `in_progress`.
- [x] T009 [US1] Wire quick complete action in `NotchContainer.tsx` to trigger Mavis spring success capsule and auto-retract.

---

## Phase 4: User Story 5 - Command Palette, Dashboard Hub & Global Shortcuts (Priority: P2)

- [x] T010 [US5] Register `/todo` slash command in `src/services/commands/commandRegistry.ts` (Category: `system`, icon: `CheckSquare`, shortcut: `Ctrl+T`).
- [x] T011 [US5] Add "Todo & Focus" interactive tile in `src/components/DashboardHubCard.tsx` showing active task counts and shortcut badge.
- [x] T012 [US5] Bind `Ctrl+T` global shortcut in `src/App.tsx` and connect `intentType === 'todo'` in `NotchContainer.tsx`.

---

## Phase 5: Verification & Quality Assurance

- [x] T013 Verify complete TypeScript compilation and build via `npm run build`.
- [x] T014 Perform end-to-end testing: test task creation with `#tag` and `p1`, keyboard row navigation, starting Now Doing, timer tick in idle notch, quick completion, and persistence across refreshes.
