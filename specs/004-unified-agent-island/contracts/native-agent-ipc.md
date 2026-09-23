# Interface Contract: Native Agent System Tools & SQLite Storage IPC

**Feature Directory**: `specs/004-unified-agent-island`  
**Created**: 2026-09-22  
**Status**: Completed  
**Target Spec**: [spec.md](../spec.md)

---

## 1. Native Tauri Commands (Rust Backend IPC)

### `execute_shell_command`
Executes a terminal command safely on the host system.

- **Signature**: `invoke('execute_shell_command', { command: string })`
- **Request Payload**:
  ```json
  {
    "command": "git status --short"
  }
  ```
- **Response Payload**:
  ```json
  {
    "stdout": " M src/App.tsx\n",
    "stderr": "",
    "exit_code": 0,
    "duration_ms": 42
  }
  ```

---

### `search_workspace_files`
Scans the filesystem/workspace for files matching a name glob or content regex pattern.

- **Signature**: `invoke('search_workspace_files', { pattern: string, path?: string, maxResults?: number })`
- **Request Payload**:
  ```json
  {
    "pattern": "*.tsx",
    "path": "/home/omid/Code/ai/voice-island/src",
    "maxResults": 50
  }
  ```
- **Response Payload**:
  ```json
  {
    "matches": [
      "/home/omid/Code/ai/voice-island/src/App.tsx",
      "/home/omid/Code/ai/voice-island/src/components/NotchContainer.tsx"
    ],
    "total_found": 2
  }
  ```

---

### `read_workspace_file`
Reads the content of a target text file with automatic size and line-count budgeting.

- **Signature**: `invoke('read_workspace_file', { path: string, maxLines?: number })`
- **Request Payload**:
  ```json
  {
    "path": "/home/omid/Code/ai/voice-island/package.json",
    "maxLines": 100
  }
  ```
- **Response Payload**:
  ```json
  {
    "content": "{\n  \"name\": \"mavis\",\n  \"version\": \"0.1.0\"\n}",
    "total_lines": 45,
    "truncated": false
  }
  ```

---

### `get_user_profile` & `set_user_profile`
Reads and writes persistent profile keys (username, preferred paths, etc.) stored in SQLite `mavis.db`.

- **Signatures**:
  - `invoke('get_user_profile')` $\rightarrow$ `Record<string, string>`
  - `invoke('set_user_profile_key', { key: string, value: string })` $\rightarrow$ `void`

---

### `search_messages_fts`
Runs high-speed BM25 full-text queries over the SQLite FTS5 index.

- **Signature**: `invoke('search_messages_fts', { query: string, limit?: number })`
- **Request Payload**:
  ```json
  {
    "query": "sprint review",
    "limit": 10
  }
  ```
- **Response Payload**:
  ```json
  {
    "results": [
      {
        "message_id": "m-12345",
        "session_id": "s-67890",
        "content_snippet": "Schedule ...<b>sprint review</b> tomorrow at 10 AM...",
        "rank": -14.82
      }
    ]
  }
  ```

---

## 2. Event Signatures

| Event Name | Direction | Payload | Description |
|:---|:---|:---|:---|
| `agent-tool-state-changed` | Frontend $\rightarrow$ Backend/UI | `ToolExecutionState` | Emitted when an agent tool begins or finishes execution. |
| `agent-approval-required` | Frontend $\rightarrow$ Notch UI | `ToolApprovalRequest` | Emitted when a mutating command requires user confirmation. |
