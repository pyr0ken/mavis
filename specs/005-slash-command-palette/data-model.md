# Data Model: Slash Command Palette & Session History

**Feature**: `specs/005-slash-command-palette`  
**Date**: 2026-09-23  

---

## Entities & Type Definitions

### 1. `CommandCategory`
```typescript
export type CommandCategory = 'system' | 'model' | 'skill' | 'mcp';
```

### 2. `SlashCommand`
```typescript
export interface SlashCommand {
  id: string;
  prefix: string;          // e.g. "/new", "/history", "/skill:review"
  label: string;           // e.g. "New Session", "Code Review Skill"
  description: string;     // e.g. "Clear active context and start fresh conversation"
  category: CommandCategory;
  icon: string;            // Lucide icon identifier (e.g. "Plus", "History", "Sparkles", "Cpu")
  shortcut?: string;       // Optional keyboard shortcut badge (e.g. "Ctrl+N")
  keywords?: string[];     // Extra terms for fuzzy matching (e.g. ["reset", "fresh", "create"])
  execute: (context: CommandExecutionContext) => void | Promise<void>;
}
```

### 3. `CommandExecutionContext`
```typescript
export interface CommandExecutionContext {
  // Session Controls
  startNewSession: () => void;
  openHistory: () => void;
  clearMessages: () => void;
  compactContext: () => void;
  switchModel: (modelId: string) => void;
  
  // Agent & Prompt Injection
  injectPrompt: (prompt: string, autoSubmit?: boolean) => void;
  setSystemPromptOverride: (prompt: string | null) => void;
  
  // UI & Overlay Controls
  closePalette: () => void;
  setNotification: (text: string, type?: 'info' | 'success' | 'warning') => void;
}
```

### 4. `SessionRecord`
```typescript
export interface SessionRecord {
  id: string;
  title: string;
  createdAt: number;       // Unix timestamp in ms
  updatedAt: number;       // Unix timestamp in ms
  messages: ChatMessage[];
  tokenCount?: number;
  model?: string;
}
```

### 5. `SessionStorageState`
```typescript
export interface SessionStorageState {
  activeSessionId: string;
  sessions: SessionRecord[];
}
```

---

## State Lifecycle & Transitions

```
[User Types '/'] ---> [Palette Open & Filtered]
                           |
          +----------------+----------------+
          |                                 |
   [Arrow Navigation]                 [Tab Key]
          |                                 |
   [Active Item Index]             [Autocomplete Prefix in Input]
          |
   [Enter Key / Click]
          |
   +------+-----------------------------+
   |                                    |
[/new /clear /compact]             [/history]
   |                                    |
[Reset Messages & State]        [Open History Drawer]
                                        |
                                [Select Past Session]
                                        |
                                [Load Session Messages]
```
