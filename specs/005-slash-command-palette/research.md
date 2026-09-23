# Research & Technical Decisions: Slash Command Palette & Session History

**Feature**: `specs/005-slash-command-palette`  
**Date**: 2026-09-23  

---

## 1. Trigger Detection & Input UX

### Decision
- When the input text starts with `/` (e.g. `/`, `/ne`, `/hist`), the `SlashCommandPalette` component activates and overlays immediately below the input bar within the notch canvas.
- As the user types characters after `/`, the query string (`userPrompt.slice(1).trim()`) is used to live-filter available commands.
- If the user presses `Backspace` when the input contains only `/`, the palette dismisses cleanly.
- If the user presses `Escape`, the palette closes and returns focus to the input.

### Rationale
- Instantaneous feedback without modifier hotkeys.
- Matches established conventions in Slack, Discord, Linear, Raycast, and Notion.
- Zero layout jumping: the container expands gracefully downwards via existing notch spring animation.

### Alternatives Considered
- *Floating modal separated from notch*: Breaks the physical bezel-notch anchor concept of Mavis.
- *Dropdown below the screen*: Not visible in floating top-bar overlay mode.

---

## 2. Categorization & Command Registry

### Decision
Group commands into 4 clean categories:
1. **System (`system`)**: `/new`, `/history`, `/clear`, `/compact`, `/settings`, `/help`
2. **Models (`model`)**: `/model:claude`, `/model:gpt4o`, `/model:gemini`, `/model:local`
3. **Skills & Playbooks (`skill`)**: `/skill:review`, `/skill:plan`, `/skill:debug`, `/skill:tdd`
4. **Integrations & MCP (`mcp`)**: `/mcp:status`, `/tools:list`, `/memory:view`

### Rationale
- Clearly communicates what is a client-side state change vs. a model prompt modifier vs. external tool inspection.
- Extensible: easy to dynamically register new plugins or MCP tools in the future.

---

## 3. Session Persistence & History Drawer

### Decision
- Implement `sessionStorageService.ts` managing a structured list of conversation sessions in `localStorage` (with fallback/sync to SQLite if available).
- Schema: `SessionRecord { id, title, createdAt, updatedAt, messages: ChatMessage[], tokenUsage?: number }`.
- When `/history` is executed:
  - The Notch enters a dedicated `history` view (or inline drawer) displaying the session list.
  - Each item shows relative time (e.g., "Just now", "2 hours ago", "Yesterday"), title snippet, and message count badge.
  - Clicking a session loads its messages into active state and returns to chat view.
  - Delete button allows removing old sessions.
  - "New Session" button at top of drawer initiates `/new`.

### Rationale
- Keeps user conversations persistent across app toggles and restarts.
- Allows seamless switching between different topics without losing context.

---

## 4. Keyboard Navigation & Accessibility

### Decision
- Arrow Up (`↑`) / Arrow Down (`↓`): Moves active index with wrap-around and automatic `scrollIntoView({ block: 'nearest' })`.
- `Enter` / `Return`: Executes the currently selected command.
- `Tab`: Autocompletes the command prefix into the text input (allowing the user to add extra arguments or parameters, e.g. `/model `).
- Visual indicator: Active item is highlighted with `bg-white/[0.08]`, `border border-white/10`, and a subtle glow.
