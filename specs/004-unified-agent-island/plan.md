# Implementation Plan: Unified Obsidian Canvas & Native ReAct Agent Engine

**Feature Directory**: `specs/004-unified-agent-island`  
**Created**: 2026-09-22  
**Status**: Ready for Tasks (`/speckit-tasks`)  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Technical Context

- **Application Architecture**: System-Level Desktop HUD (Tauri 2.0 Rust Core + React 19 / TypeScript / Tailwind CSS / GSAP).
- **Visual Design**: Monolithic Unified Obsidian Canvas (`#000000`) replacing nested `#16181F` card. Continuous `AppleIntelligenceGlow` neon contour with 1px subtle hairlines (`border-white/10`).
- **Agent Orchestrator**: Client-side ReAct loop in TypeScript with live thinking/tool streaming states (`thinking`, `tool_executing`, `streaming`, `waiting_approval`).
- **System Tools & IPC**: Rust native commands (`execute_shell_command`, `search_workspace_files`, `read_workspace_file`) with smart approval gating for mutating commands.
- **Persistent Storage & Memory**: Embedded SQLite with FTS5 virtual table and trigram tokenizer at `~/.config/mavis/mavis.db`.
- **Action Card Interceptors**: Seamless morphing to Frosted Acrylic Sheet `GmailComposeCard` and `CalendarEventCard` on structured tool calls.

---

## 2. Constitution & Gate Checks

| Constitution Principle | Status | Compliance Details |
|:---|:---|:---|
| **I. Fluid Spring Physics & Notch Morphing** | **PASS** | Notch expands as a single contiguous black canvas with hardware-anchored concave fillets and GSAP spring dynamics. |
| **II. Ultra-Lightweight Tauri 2.0 Architecture** | **PASS** | Native Rust tools + embedded SQLite keep memory footprint `< 35MB RAM` and idle CPU `< 0.1%`. |
| **III. Privacy-First Audio Capture** | **PASS** | Microphones active only during explicit user push-to-talk/toggle with prominent visual aura. |
| **IV. Structured Intent Execution** | **PASS** | ReAct tool calling intercepts email/calendar intents to present editable Action Cards before final execution. |
| **V. Architectural Layering** | **PASS** | Strict separation: `src-tauri/` (tools, SQLite, OS bridge) and `src/` (ReAct orchestrator, UI, animations). |
| **VI. Dark Elegance Aesthetics** | **PASS** | Obsidian black canvas (`#000000`), frosted glass acrylic sheets, and high-contrast typography. |

---

## 3. Phase Breakdown

### Phase 0: Outline & Research (`research.md`)
- [x] Analyzed elimination of nested card anti-pattern and single-surface canvas design.
- [x] Researched TypeScript ReAct loop orchestrator and tool state streaming.
- [x] Formulated smart approval policy for mutating shell commands.
- [x] Evaluated SQLite FTS5 trigram indexing for sub-millisecond search.

### Phase 1: Design & Contracts (`data-model.md`, `contracts/`, `quickstart.md`)
- [x] Defined `AgentState`, `ToolExecutionState`, `ToolDefinition`, and `SYSTEM_TOOLS` in `data-model.md`.
- [x] Specified native Tauri IPC commands and event signatures in `contracts/native-agent-ipc.md`.
- [x] Authored end-to-end verification scenarios in `quickstart.md`.

### Phase 2: Implementation Tasks (Next Step: `/speckit-tasks`)
- **Task 1: Unified Obsidian Canvas Refactor**:
  - Remove inner card container (`#16181F`), duplicate headers, and nested margins in `NotchContainer.tsx`, `ChatStreamCard.tsx`, and `DropdownCard.tsx`.
  - Render conversation stream, ghost input, and code blocks directly on the monolithic `#000000` body.
- **Task 2: Native Rust System Tools**:
  - Implement `execute_shell_command`, `search_workspace_files`, and `read_workspace_file` in `src-tauri/src/lib.rs`.
- **Task 3: SQLite Database with FTS5 Integration**:
  - Add `rusqlite` with `bundled-full` feature to `src-tauri/Cargo.toml`.
  - Implement `user_profile`, `sessions`, `messages`, and `messages_fts` tables with Tauri IPC commands.
- **Task 4: Client ReAct Engine & Tool State Streaming**:
  - Create `src/services/agent/reactEngine.ts` to manage tool calling, thinking states, and multi-turn loops.
  - Add the live `ToolExecutionPill` and smart approval banner in the notch UI.
- **Task 5: Action Card Interceptors**:
  - Wire `draft_email` and `draft_calendar_event` to pre-populate and open the Frosted Acrylic `GmailComposeCard` / `CalendarEventCard`.
- **Task 6: Verification & Quality Polish**:
  - Verify complete workflows against `quickstart.md` and ensure build passes.

---

## 4. Deliverables & File Mapping

```
voice-island/
├── src-tauri/
│   ├── Cargo.toml                    # rusqlite with bundled-full (FTS5)
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs                    # System tools IPC + SQLite integration
│       └── db.rs                     # SQLite migrations & FTS5 queries
├── src/
│   ├── App.tsx                       # ReAct engine integration & state machine
│   ├── types/
│   │   ├── island.ts                 # AgentState, ToolExecutionState
│   │   └── tauri-ipc.d.ts            # New IPC command typings
│   ├── services/
│   │   └── agent/
│   │       ├── reactEngine.ts        # Function calling & ReAct loop
│   │       └── systemTools.ts        # Tool definitions & schemas
│   └── components/
│       ├── NotchContainer.tsx        # Single-surface Obsidian canvas
│       ├── ChatStreamCard.tsx        # Direct markdown & code rendering
│       ├── LiveToolPill.tsx          # Dynamic tool execution banner
│       ├── ToolApprovalBanner.tsx    # Mutating command confirmation
│       ├── GmailComposeCard.tsx      # Frosted acrylic sheet styling
│       └── CalendarEventCard.tsx     # Frosted acrylic sheet styling
└── specs/004-unified-agent-island/   # Spec Kit artifacts
```
