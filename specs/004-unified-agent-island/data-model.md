# Data Model: Unified Obsidian Canvas & Native ReAct Agent Engine

**Feature Directory**: `specs/004-unified-agent-island`  
**Created**: 2026-09-22  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md)

---

## 1. Core TypeScript Entities & State Types

### A. Agent Execution State Machine
```typescript
export type AgentState = 
  | 'idle'
  | 'thinking'
  | 'tool_executing'
  | 'streaming'
  | 'waiting_approval'
  | 'action_card'
  | 'success';

export interface ToolExecutionState {
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'requires_approval';
  result?: string;
  error?: string;
  startTime?: number;
  durationMs?: number;
}

export interface ToolApprovalRequest {
  id: string;
  toolName: string;
  command: string;
  reason: string;
  isMutating: boolean;
}
```

### B. Tool Definitions & Structured Schemas
```typescript
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

// Built-in System Tools
export const SYSTEM_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'execute_shell',
      description: 'Execute a shell command on the host system.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command line to execute',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search for files by name glob or content regex pattern.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'File glob pattern or text search query',
          },
          path: {
            type: 'string',
            description: 'Directory path to search in (defaults to current workspace)',
          },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a text file from disk.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or workspace-relative path to the file',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Draft an email message in the visual Gmail composer card.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Subject line of the email' },
          body: { type: 'string', description: 'Body text content of the draft' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_calendar_event',
      description: 'Draft a calendar event in the visual Google Calendar card.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title or summary of the event' },
          dateTime: { type: 'string', description: 'Natural date and time (e.g. Thursday 2:00 PM)' },
          attendee: { type: 'string', description: 'Attendee email address' },
          isVideoCall: { type: 'boolean', description: 'Whether to enable Google Meet conferencing' },
        },
        required: ['title', 'dateTime'],
      },
    },
  },
];
```

---

## 2. SQLite Database Schema (`~/.config/mavis/mavis.db`)

```sql
-- User Profile & Preferences
CREATE TABLE IF NOT EXISTS user_profile (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Conversation Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Messages Store
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'system', 'user', 'assistant', 'tool'
    content TEXT NOT NULL,
    tool_calls TEXT, -- JSON serialized tool calls if applicable
    tool_call_id TEXT, -- For tool response messages
    created_at INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Full-Text Search Virtual Table with Trigram & BM25 Ranking
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    message_id UNINDEXED,
    session_id UNINDEXED,
    content,
    tokenize='trigram'
);
```

---

## 3. State Transitions & Lifecycle

```
[ User Input (Enter) ]
        │
        ▼
[ Thinking State ] ──── (No Tools Needed) ────► [ Streaming Response ] ──► [ Idle Canvas ]
        │
 (Tool Call Triggered)
        │
        ├──────────── (Mutating Shell Command) ───────────► [ Waiting Approval ]
        │                                                          │
        │                                                  (User Approves / Denies)
        │                                                          │
        ├──────────── (Read-Only Tool / Approved) ◄────────────────┘
        │
        ▼
[ Tool Executing (Pill Animation) ]
        │
 (Tool Result Injected)
        │
        ▼
[ Continue ReAct Loop / Stream Output ]
        │
        ├──────────── (Interactive Intent: Gmail/Calendar) ─► [ Action Card ] ──► [ Success Capsule ]
        │
        ▼
[ Done / Dismiss ] ──────────────────────────────────────────────────────────► [ Compact Notch ]
```
