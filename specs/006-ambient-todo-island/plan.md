# Implementation Plan: Ambient Todo Island & Keyboard-Driven Action Card

**Feature**: `specs/006-ambient-todo-island`  
**Date**: 2026-10-04  
**Status**: Ready for Tasks  

---

## 1. Technical Context

- **Frontend Core**: React 19 + TypeScript + Tailwind CSS + Lucide Icons.
- **Components & Services to Create/Update**:
  - `src/types/todo.ts`: Complete data definitions for `TodoItem`, `TodoFilter`, `TodoPriority`, `TodoStatus`, and parser tokens.
  - `src/services/todo/todoStorageService.ts`: Zero-latency local storage engine with event listeners/subscriptions for reactive updates across the app (Idle Notch & Action Card).
  - `src/components/TodoListCard.tsx`: Linear/Raycast-inspired dark minimalist Todo card with full keyboard navigation (`j`/`k`, `Space`, `Enter`/`d`, `1`/`2`/`3`, `Backspace`/`Delete`, filter tabs, tag badges, and quick natural language input).
  - `src/components/AmbientNowDoing.tsx`: Live Activity widget inside the collapsed idle notch (`400px x 54px`), showing pulsating focus icon, active doing task, live formatted elapsed timer (`[14m]`), and one-click quick complete check button.
  - `src/components/NotchContainer.tsx`: Integrated to render `AmbientNowDoing` when a task is active in idle state, and mount `TodoListCard` when `intentType === 'todo'`.
  - `src/components/DashboardHubCard.tsx`: Add a dedicated Quick Agent Workflow card for "Todo List & Focus" showing active count and shortcut.
  - `src/services/commands/commandRegistry.ts`: Register `/todo` slash command with shortcut `Ctrl+T` and keywords.
  - `src/App.tsx`: Provide global shortcut `Ctrl+T`, link `/todo` command execution, and sync active doing state with Mavis notification toasts.

---

## 2. Constitution Alignment

- **I. Fluid Spring Physics & Notch-Anchored Morphing**: The Live Activity view in the idle notch and the full `860px x 480px` Action Card morph seamlessly using Mavis spring physics without frame drops or layout jumpiness.
- **II. Ultra-Lightweight Floating Desktop**: 100% local, zero external network requests, zero heavy libraries, maintaining < 35MB RAM footprint.
- **VI. Dark Elegance & Linear/Raycast Design**: Pure `#000000` / `#0b0f19` backdrop, razor-thin borders (`border-white/10`), crisp monospaced timer typography, high-contrast priority chips, and sleek keyboard visual cues.

---

## 3. Work Breakdown Phases

### Phase 1: Core Data Models & Reactive Storage Engine
- Implement `src/types/todo.ts` with types for `TodoItem`, `TodoPriority`, `TodoStatus`, `TodoFilter`, and input parse helper.
- Implement `src/services/todo/todoStorageService.ts`:
  - CRUD operations (create, toggleStatus, setPriority, delete, setDoingTask, completeDoingTask).
  - Reactive listener subscription pattern (`subscribe(cb)`) so any change in the Action Card instantly updates the Idle Notch widget.
  - Natural language parser extracting title, priority (`p1`, `p2`, `p3`), and tags (`#tag`).
  - Elapsed timer calculation from `doingStartedAt`.

### Phase 2: Action Card Component (`TodoListCard.tsx`)
- Build `src/components/TodoListCard.tsx`:
  - Top header with search / quick input field and hotkey hints.
  - Category filter pills (`All`, `Active`, `Doing`, `Done`, `P1`).
  - Task item rows with priority badges, status checkboxes, tags, and elapsed timers.
  - Full keyboard event listener: `j`/`k` (or `Up`/`Down`) for row focus, `Space` for toggle done, `Enter` / `d` to set Now Doing, `1`/`2`/`3`/`0` for priority, `Delete`/`Backspace` to remove.
  - Visual empty states and smooth CSS transitions.

### Phase 3: Ambient Notch "Now Doing" Widget (`AmbientNowDoing.tsx`)
- Build `src/components/AmbientNowDoing.tsx`:
  - Pulsing amber/cyan focus icon with glowing aura.
  - Active task title (with smart truncation).
  - Live ticking timer (`[Xm]` or `[Xh Ym]`) refreshed every second.
  - Direct quick complete button (`Check` icon) that triggers Mavis success capsule.
  - Click on title/body to open full `/todo` Action Card.

### Phase 4: Integration with Notch, Commands, Hub & App
- Register `/todo` slash command in `src/services/commands/commandRegistry.ts`.
- Update `src/types/island.ts` to include `'todo'` in `ActionCardType`.
- Update `src/components/NotchContainer.tsx` to:
  - Display `AmbientNowDoing` inside the idle top bar when a task is in progress.
  - Render `TodoListCard` when `intentType === 'todo'`.
- Update `src/components/DashboardHubCard.tsx` to add "Todo & Focus" quick action.
- Update `src/App.tsx` to handle `Ctrl+T` shortcut and `/todo` command.

### Phase 5: Verification & Quality Assurance
- Run `npm run build` and ensure zero TypeScript or linter errors.
- Verify keyboard navigation ergonomics, natural language input, timer accuracy, and smooth transitions.
