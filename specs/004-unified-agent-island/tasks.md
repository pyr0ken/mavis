# Tasks: Unified Obsidian Canvas & Native ReAct Agent Engine

**Feature Directory**: `specs/004-unified-agent-island`  
**Created**: 2026-09-22  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Dependency Graph & Implementation Strategy

```
Phase 1: Setup & Cargo Dependencies (T001-T003) [COMPLETED]
        │
        ▼
Phase 2: Foundational Types, System Tools & Schemas (T004-T007) [COMPLETED]
        │
        ├─────────────────────────────────────────┐
        ▼                                         ▼
Phase 3: US1 - Unified Obsidian Canvas (T008-T012)  Phase 4: US2 - Native ReAct Agent Loop (T013-T017) [COMPLETED]
        │                                         │
        └───────────────────┬─────────────────────┘
                            ▼
Phase 5: US3 - Smart Action Card Interceptors (T018-T021) [COMPLETED]
                            │
                            ▼
Phase 6: US4 - SQLite Database & FTS5 Search (T022-T025) [COMPLETED]
                            │
                            ▼
Phase 7: Polish, Quality Gates & Verification (T026-T029) [COMPLETED]
```

---

## Phase 1: Setup & Dependencies

- [x] T001 [P] Add `rusqlite` with `["bundled-full"]` features to `src-tauri/Cargo.toml`
- [x] T002 [P] Verify Tauri 2.0 permissions and capability rules for new native commands in `src-tauri/capabilities/default.json`
- [x] T003 Ensure database storage directory `~/.config/mavis/` creation helper in `src-tauri/src/db.rs`

---

## Phase 2: Foundational Types & Data Models

- [x] T004 [P] Define `AgentState`, `ToolExecutionState`, and `ToolApprovalRequest` in `src/types/island.ts`
- [x] T005 [P] Declare native IPC command signatures (`execute_shell_command`, `search_workspace_files`, `read_workspace_file`, `search_messages_fts`, `get_user_profile`, `set_user_profile_key`) in `src/types/tauri-ipc.d.ts`
- [x] T006 [P] Define `SYSTEM_TOOLS` definitions and OpenAI function-calling schemas in `src/services/agent/systemTools.ts`
- [x] T007 [P] Create database schema migrations (`user_profile`, `sessions`, `messages`, and `messages_fts` virtual table) in `src-tauri/src/db.rs`

---

## Phase 3: User Story 1 - Unified Obsidian Canvas (Single-Surface Architecture) [P1]

**Goal**: Eliminate nested card anti-patterns (`#16181F` / `#1F222B`), rendering the conversation stream, ghost input, and code blocks directly on the monolithic deep black (`#000000`) body with 1px subtle hairlines.

- [x] T008 [US1] Remove nested `#16181F` card wrapper, redundant headers, and double padding in `src/components/NotchContainer.tsx`
- [x] T009 [US1] Refactor `src/components/ChatStreamCard.tsx` to render directly on transparent/black canvas with 1px subtle hairlines (`border-white/10`)
- [x] T010 [US1] Update `src/components/AppleIntelligenceGlow.tsx` to provide seamless perimeter rim lighting around the unified expanded canvas
- [x] T011 [US1] Polish dynamic GSAP spring expansion in `src/hooks/useIslandAnimation.ts` to stretch the single obsidian body smoothly
- [x] T012 [US1] Verify hotkey toggle (`Ctrl + Space`) and prompt submit (`Enter` / multiline `Shift + Enter`) on the unified canvas in `src/App.tsx`

---

## Phase 4: User Story 2 - Native ReAct Agent Engine & Tool Calling [P1]

**Goal**: Implement a client-side ReAct loop orchestrator in TypeScript with live thinking/tool streaming states and native Rust system tools.

- [x] T013 [US2] Implement Rust native system commands (`execute_shell_command`, `search_workspace_files`, `read_workspace_file`) in `src-tauri/src/lib.rs`
- [x] T014 [US2] Implement client ReAct engine orchestrator with OpenAI tool-calling loop in `src/services/agent/reactEngine.ts`
- [x] T015 [P] [US2] Create `LiveToolPill` component displaying active thinking/tool execution status (`Thinking...`, `🔍 Searching...`) in `src/components/LiveToolPill.tsx`
- [x] T016 [P] [US2] Create `ToolApprovalBanner` component with smart approval gating for mutating commands in `src/components/ToolApprovalBanner.tsx`
- [x] T017 [US2] Connect `reactEngine` and live tool status events to the main conversation flow in `src/App.tsx`

---

## Phase 5: User Story 3 - Smart Action Card Interceptors [P2]

**Goal**: Intercept structured intent tool calls (`draft_email`, `draft_calendar_event`) and morph the canvas into Frosted Acrylic Sheet Action Cards for user review.

- [x] T018 [US3] Refactor `src/components/GmailComposeCard.tsx` and `src/components/CalendarEventCard.tsx` to Frosted Acrylic Sheet styling with backdrop blur
- [x] T019 [US3] Implement tool interceptor in `src/services/agent/reactEngine.ts` to capture `draft_email` and `draft_calendar_event` parameters
- [x] T020 [US3] Wire pre-populated tool arguments into `GmailComposeCard` and `CalendarEventCard` in `src/components/DropdownCard.tsx` and `src/App.tsx`
- [x] T021 [US3] Verify seamless morphing from Action Card approval to `SuccessCapsule` HUD and smooth notch retraction in `src/App.tsx`

---

## Phase 6: User Story 4 - SQLite Database & FTS5 Full-Text Search [P2]

**Goal**: Provide sub-millisecond full-text search across past conversation history and store local user preferences.

- [x] T022 [US4] Implement SQLite session persistence and FTS5 indexing IPC commands in `src-tauri/src/db.rs` and `src-tauri/src/lib.rs`
- [x] T023 [US4] Integrate session saving and message persistence on incoming streaming completion in `src/App.tsx`
- [x] T024 [P] [US4] Implement user profile loader and system prompt injector (including `~/SecondBrain` path) in `src/services/agent/reactEngine.ts`
- [x] T025 [US4] Implement quick FTS5 message search helper in `src/services/agent/systemTools.ts`

---

## Phase 7: Polish, Quality Gates & Verification

- [x] T026 Execute full TypeScript type-check and frontend production build (`npm run build`)
- [x] T027 Execute Rust compilation check (`cargo check --manifest-path src-tauri/Cargo.toml`)
- [x] T028 Perform manual verification against all 5 scenarios in `specs/004-unified-agent-island/quickstart.md`
- [x] T029 Audit idle background resource consumption to verify `< 35MB RAM` and `< 0.1% CPU`
