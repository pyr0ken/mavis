# Quickstart & Verification Guide: Unified Obsidian Canvas & Native ReAct Agent Engine

**Feature Directory**: `specs/004-unified-agent-island`  
**Created**: 2026-09-22  
**Status**: Ready for Verification  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Prerequisites & Build Verification

```bash
# Verify frontend dependencies and build
npm run build

# Verify Tauri Rust compilation and tests
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 2. Interactive Testing Scenarios

### Scenario 1: Unified Obsidian Canvas & Zero Nested Card
1. Launch the application or dev server (`npm run dev` / `cargo tauri dev`).
2. Press `Ctrl + Space` or type a prompt into the top notch and press `Enter`.
3. **Expected Result**:
   - The notch expands smoothly into a single solid black canvas (`#000000`).
   - The inner slate-navy card (`#16181F`) and nested borders are completely absent.
   - Text, markdown, and KaTeX math render directly against the deep obsidian canvas with clean 1px separators.

---

### Scenario 2: Agent ReAct Tool Execution & Live Status Pill
1. Type a query requiring file discovery: `"List all TypeScript components in the src/components folder"` and press `Enter`.
2. **Expected Result**:
   - The notch displays an active thinking state (`Thinking...`).
   - A live tool pill appears above the conversation: `🔍 Searching files: src/components...`.
   - The tool output is ingested into the ReAct loop and the assistant streams the final list formatted with syntax-highlighted code.

---

### Scenario 3: Smart Action Card Interceptor (Gmail & Calendar)
1. Type: `"Draft an email to David regarding sprint sync"` and press `Enter`.
2. **Expected Result**:
   - The agent detects the `draft_email` tool call.
   - Instead of sending immediately, the unified canvas renders the **Frosted Acrylic Sheet** `GmailComposeCard` with pre-filled recipient (`david@...`), subject, and body.
   - Clicking **Send** triggers the `SuccessCapsule` HUD and cleanly retracts the notch.

---

### Scenario 4: Smart Approval for Mutating Shell Commands
1. Ask the assistant to run a command like `"Show git status"`.
   - **Expected**: Runs automatically and outputs status.
2. Ask the assistant to run a command like `"Remove temp files in build directory"`.
   - **Expected**: The notch pauses with an inline **Approval Banner** displaying the command and `[Allow]` / `[Deny]` buttons before any execution occurs.

---

### Scenario 5: SQLite Database & FTS5 Full-Text Search
1. Open a new chat session and ask a question.
2. Verify that `~/.config/mavis/mavis.db` exists and contains indexed messages in `messages_fts`.
3. Query past conversations using full-text search keywords to confirm sub-millisecond retrieval.
