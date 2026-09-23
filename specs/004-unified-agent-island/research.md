# Technical Research: Unified Obsidian Canvas & Native ReAct Agent Engine

**Feature Directory**: `specs/004-unified-agent-island`  
**Created**: 2026-09-22  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Unified Obsidian Canvas & Elimination of Nested Card Anti-Pattern

### Problem Statement
The previous architecture wrapped the conversation in an inner card (`#16181F` / `#1F222B`) placed with nested padding inside the outer black notch container (`#000000`). This resulted in visual clutter, redundant border radiuses, wasted vertical space, and an awkward "window inside window" appearance that detracted from the Apple Dynamic Island / Raycast aesthetic.

### Decision & Architecture
- **Single-Surface Body**: The entire notch container expands as a monolithic black glass surface (`#000000` with `backdrop-filter: blur(32px)`).
- **Direct Content Rendering**: The active prompt input, thinking indicator, tool state pill, conversation messages, LaTeX KaTeX formulas, and highlighted code blocks render directly on the unified black body.
- **Micro-Separators (Subtle 1px Hairlines)**: Instead of bulky headers, minimal horizontal dividers (`border-t border-white/10`) separate the top ghost input, main content area, and bottom action footer.
- **Continuous Perimeter Rim Glow**: The `AppleIntelligenceGlow` component surrounds the entire unified perimeter, creating a vivid, uninterrupted neon contour.

### Alternatives Considered
- **Keeping the inner card with darker colors**: Rejected because double border radiuses and nested padding still waste space and feel like a website popup rather than a native system module.

---

## 2. Client-Side ReAct Loop & Function Calling Orchestrator

### Problem Statement
Mavis was previously limited to a single-turn streaming text chat endpoint without autonomous tool calling or iterative reasoning capabilities.

### Decision & Architecture
- **Hybrid ReAct Loop (TypeScript Orchestrator)**:
  - Supports OpenAI-compatible tool schemas (`tools: [...]`, `tool_choice: "auto"`).
  - Handles multi-turn iterations:
    $$\text{User Prompt} \rightarrow \text{Thinking State} \rightarrow \text{Tool Calls} \rightarrow \text{Execute Tools} \rightarrow \text{Tool Results} \rightarrow \text{Final Streaming Response}$$
  - **Live State Machine in Notch**:
    - `idle`: Compact top bar with live typewriter placeholder.
    - `thinking`: Ambient neon glow pulsating with `Thinking...` status.
    - `tool_executing`: High-contrast live pill displaying the active tool (e.g. `🔍 Searching files in workspace...` or `⚡ Executing shell command...`).
    - `streaming`: Incremental token delivery for the final response.

---

## 3. Native System Tools in Rust Tauri IPC

### Problem Statement
The agent needs direct, high-performance, and secure access to the local Linux environment without requiring an external heavy Python runtime.

### Decision & Architecture
- **Rust Native System Tools**:
  1. `execute_shell(command: String, requires_approval: bool)`: Executes shell commands via `std::process::Command` with standard stdout/stderr capture and timeout protection.
  2. `search_files(pattern: String, path: Option<String>, max_results: Option<usize>)`: Performs fast recursive directory scanning and pattern matching.
  3. `read_file(path: String, max_lines: Option<usize>)`: Reads file contents safely with head/tail truncation for large files.
- **Smart Approval Gate (Security Policy)**:
  - Read-only tools (`read_file`, `search_files`) execute automatically without interrupting the user.
  - Mutating shell commands (`rm`, `mv`, `git commit`, `chmod`, etc.) pause the loop and present an inline **Approval Banner** in the notch with **Allow / Deny** buttons before execution.

---

## 4. Smart Action Card Interceptors (Gmail & Calendar)

### Problem Statement
When a user asks to draft an email or schedule a meeting, automated agents often execute actions in the background without user confirmation, risking accidental emails or wrong calendar slots.

### Decision & Architecture
- **Tool Interception Pattern**:
  - The model provides structured tool calls `draft_email(to, subject, body)` or `draft_calendar_event(title, date_time, attendees, is_video_call)`.
  - The Mavis client intercepts these calls and automatically morphs the unified canvas into the **Frosted Acrylic Sheet** Action Card (`GmailComposeCard` or `CalendarEventCard`) with all parameters pre-populated.
  - The user can review, edit fields in-place, and click **Send / Save** to complete the action.
  - Upon completion, the card smoothly morphs into the `SuccessCapsule` before retracting to the idle notch.

---

## 5. Local SQLite Database with FTS5 Full-Text Search

### Problem Statement
User preferences, persona facts, and historical conversation sessions need persistent, sub-millisecond full-text searchable storage without inflating memory.

### Decision & Architecture
- **SQLite with FTS5 & Trigram Tokenizer**:
  - Embedded via `rusqlite` in Rust at `~/.config/mavis/mavis.db`.
  - Schema includes:
    - `user_profile`: Key-value store for user name, preferred languages, and key directories (`~/SecondBrain`, workspace roots).
    - `sessions`: Conversation session metadata.
    - `messages`: Message store.
    - `messages_fts`: Virtual FTS5 table using BM25 ranking for sub-millisecond search across all past conversations.
  - Idle memory footprint is `< 2MB RAM`.
