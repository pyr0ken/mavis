# Implementation Plan: Unified Slash Command Palette & Session History

**Feature**: `specs/005-slash-command-palette`  
**Date**: 2026-09-23  
**Status**: Ready for Tasks  

---

## 1. Technical Context

- **Frontend Core**: React 19 + TypeScript + Tailwind CSS.
- **Components to Create/Update**:
  - `src/types/commands.ts`: Type definitions for commands, categories, and session storage.
  - `src/services/commands/commandRegistry.ts`: Static and dynamic registry of all system commands, skills, and MCP tools with fuzzy search.
  - `src/services/session/sessionStorageService.ts`: Local persistence for conversation sessions.
  - `src/components/SlashCommandPalette.tsx`: Floating frosted acrylic palette with keyboard navigation, category sectioning, and icons.
  - `src/components/HistoryDrawer.tsx`: Obsidian dark session manager drawer for reviewing, restoring, and deleting sessions.
  - `src/components/NotchContainer.tsx`: Wire slash detection (`/`), keyboard capture, palette rendering, and history view toggle.
  - `src/App.tsx`: Provide command execution handlers (session reset, history view, clear, model switch, notification toasts).

---

## 2. Constitution Alignment

- **I. Fluid Spring Physics & Notch-Anchored Morphing**: Palette and history views animate smoothly without layout jank.
- **II. Ultra-Lightweight Floating Desktop**: Zero heavy dependencies, pure React/Tailwind/Lucide implementation.
- **VI. Dark Elegance & Linear/Raycast Design**: Obsidian dark palette, hairline borders, frosted backdrop, crisp typography.

---

## 3. Work Breakdown Phases

### Phase 1: Core Data Model & Registry Engine
- Implement `src/types/commands.ts`
- Implement `src/services/commands/commandRegistry.ts` with built-in commands (`/new`, `/history`, `/clear`, `/compact`, `/model:*`, `/skill:*`, `/mcp:*`) and fuzzy search.
- Implement `src/services/session/sessionStorageService.ts` with LocalStorage session persistence.

### Phase 2: UI Components
- Build `src/components/SlashCommandPalette.tsx` with Raycast-style category headers, keyboard selection, shortcuts, and frosted glass styling.
- Build `src/components/HistoryDrawer.tsx` with session list, search bar, delete action, relative timestamps, and instant session switcher.

### Phase 3: Notch Container & App Integration
- Wire slash detection in `NotchContainer.tsx` (when `userPrompt.startsWith('/')`).
- Handle `ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape` inside `NotchContainer` keyboard listener.
- Connect commands in `App.tsx` (handle `/new`, `/history`, `/clear`, `/model`, `/compact`).
- Implement visual feedback (floating toast / notification capsule for command execution).

### Phase 4: Verification & Quality Assurance
- Run `npm run build` and ensure zero TypeScript / Lint errors.
- Test keyboard navigation, fuzzy filtering, session creation, and history switching.
