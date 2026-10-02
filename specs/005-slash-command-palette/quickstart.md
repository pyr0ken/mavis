# Quickstart & Validation Guide: Slash Command Palette

**Feature**: `specs/005-slash-command-palette`  
**Date**: 2026-09-23  

---

## 1. Prerequisites & Build Check

```bash
cd /home/omid/Code/ai/mavis
npm run build
```

---

## 2. Interactive Test Scenarios

### Scenario 1: Palette Open and Dismissal
1. Open the Island overlay (`Ctrl + Space` / toggle button).
2. Type `/` in the input field.
3. **Verify**: The `SlashCommandPalette` appears immediately below the input with categorized items (System, Models, Skills, Integrations).
4. Press `Escape` or `Backspace`.
5. **Verify**: The palette closes and the input returns to normal state.

### Scenario 2: Live Fuzzy Search & Arrow Navigation
1. Type `/his`.
2. **Verify**: The `/history` command is displayed at the top of the search results with its badge and description.
3. Press `ArrowDown` and `ArrowUp`.
4. **Verify**: Highlighted selection moves seamlessly.
5. Press `Tab`.
6. **Verify**: The input text is autocompleted to `/history`.

### Scenario 3: Execution of `/new` (Session Reset)
1. Send a test message in the chat.
2. Type `/new` and hit `Enter`.
3. **Verify**:
   - The messages area is reset to a clean state.
   - A new session ID is generated and recorded.
   - A subtle notification capsule ("New session started") appears.

### Scenario 4: Execution of `/history` (Session Switcher)
1. Type `/history` and hit `Enter`.
2. **Verify**:
   - The History Drawer / View expands inside the Notch.
   - Past conversation sessions are listed with timestamp and message count.
   - Clicking a past session restores its message thread.
   - Clicking "Back to Chat" or `Escape` returns to the active conversation.

### Scenario 5: Skill & MCP Commands
1. Type `/skill:review` and press `Enter`.
2. **Verify**: The Code Review skill prompt is loaded or injected into the prompt input, ready for user submission.
3. Type `/mcp:status` and press `Enter`.
4. **Verify**: System displays the active MCP status / tools list.
