# Tasks: Unified Slash Command Palette & Session History

**Feature**: `specs/005-slash-command-palette`  
**Date**: 2026-09-23  

---

## Phase 1: Setup & Foundational Infrastructure

- [x] T001 Define core types and interfaces in `src/types/commands.ts` (CommandCategory, SlashCommand, CommandExecutionContext, SessionRecord, SessionStorageState).
- [x] T002 Implement local session persistence engine in `src/services/session/sessionStorageService.ts` (localStorage CRUD for conversation sessions with auto-title generation).
- [x] T003 Implement command registry and fuzzy search matcher in `src/services/commands/commandRegistry.ts` (Built-in commands for `/new`, `/history`, `/clear`, `/compact`, `/model:*`, `/skill:*`, `/mcp:*`).

---

## Phase 2: User Story 1 & 2 - Slash Command Palette UI & Keyboard Navigation (Priority: P1)

- [x] T004 [US1] Create the Raycast-style floating palette component in `src/components/SlashCommandPalette.tsx` (Obsidian frosted dark glass, category headers, icon badges, keyboard selection highlighting, shortcuts, and empty search state).
- [x] T005 [US2] Wire keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) and click handlers in `src/components/SlashCommandPalette.tsx`.

---

## Phase 3: User Story 3 - Session Controls (`/new`, `/clear`, `/compact`) (Priority: P1)

- [x] T006 [US3] Implement session reset and clear handlers in `src/App.tsx` (creating fresh session, clearing active tool states, updating message stream, showing toast).
- [x] T007 [US3] Add command notification pill/toast in `src/App.tsx` or `src/components/NotchContainer.tsx` to provide immediate visual feedback upon command execution.

---

## Phase 4: User Story 4 - Session History Drawer (`/history`) (Priority: P2)

- [x] T008 [US4] Create the History Drawer component in `src/components/HistoryDrawer.tsx` (Session list with relative timestamps, message count badges, session title search, switch session handler, and delete session action).
- [x] T009 [US4] Integrate History Drawer inside `src/components/NotchContainer.tsx` and `src/App.tsx` with smooth morphing animation and back-to-chat navigation.

---

## Phase 5: User Story 5 - Skill Workflows & Integrations (`/skill:*`, `/mcp:*`, `/model:*`) (Priority: P2)

- [x] T010 [US5] Implement skill prompt injection and system prompt modifier in `src/services/commands/commandRegistry.ts` and `src/App.tsx`.
- [x] T011 [US5] Implement `/model:*` switcher and `/mcp:status` inspector in `src/App.tsx`.

---

## Phase 6: Polish, Integration & Quality Assurance

- [x] T012 Integrate Slash Command detection and event handling into `src/components/NotchContainer.tsx`.
- [x] T013 Update `src/App.tsx` to mount the command palette, bind all execution context actions, and persist chat messages to the active session.
- [x] T014 Run build verification (`npm run build`) to ensure zero TypeScript/linter errors and test end-to-end functionality.
