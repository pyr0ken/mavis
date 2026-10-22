# Data Model: Ambient Todo Island & Action Card

**Feature**: `specs/006-ambient-todo-island`  
**Date**: 2026-10-04  
**Status**: Completed  

---

## Entities & Type Definitions

### 1. `TodoPriority`
```typescript
export type TodoPriority = 'p1' | 'p2' | 'p3' | 'none';
```
- `p1`: Urgent / Critical (Neon Red accent `#f43f5e`)
- `p2`: High / Medium (Amber accent `#f59e0b`)
- `p3`: Normal / Low (Sky Blue accent `#0284c7`)
- `none`: Default / Unassigned (Slate accent `#64748b`)

### 2. `TodoStatus`
```typescript
export type TodoStatus = 'todo' | 'in_progress' | 'done';
```
- `todo`: Task is pending.
- `in_progress`: Task is actively being worked on (only ONE task at any time can have this status). Triggers Ambient Notch Live Activity.
- `done`: Task is completed.

### 3. `TodoItem`
```typescript
export interface TodoItem {
  id: string;               // Unique ID: `todo-${Date.now()}-${random}`
  title: string;            // Cleaned task title
  status: TodoStatus;       // 'todo' | 'in_progress' | 'done'
  priority: TodoPriority;   // 'p1' | 'p2' | 'p3' | 'none'
  tags: string[];           // Extracted hashtags e.g. ['oxiroute', 'bug']
  createdAt: number;        // Epoch timestamp (ms)
  completedAt?: number;     // Epoch timestamp when marked done (ms)
  doingStartedAt?: number;  // Epoch timestamp when marked in_progress (ms)
}
```

### 4. `TodoFilter`
```typescript
export type TodoFilter = 'all' | 'active' | 'doing' | 'done' | 'p1';
```

### 5. `TodoStorageState`
```typescript
export interface TodoStorageState {
  items: TodoItem[];
  activeDoingId?: string | null;
}
```

---

## State Transitions & Invariants

```
                      +-------------------+
                      |       TODO        |
                      +-------------------+
                        /               \
        [Enter / 'd']  /                 \  [Space]
                      v                   v
            +-------------------+       +-------------------+
            |    IN_PROGRESS    | ----> |       DONE        |
            |   (Now Doing)     |       +-------------------+
            +-------------------+                 |
                      |                           | [Space (uncheck)]
                      +---------------------------+
                                    |
                                    v
                            +---------------+
                            |     TODO      |
                            +---------------+
```

### Single Active Doing Invariant
- At any point in time, **at most one** `TodoItem` can have `status === 'in_progress'`.
- Setting a task to `in_progress` automatically changes any other previously active `in_progress` task back to `todo`.
- Completing an `in_progress` task sets its status to `done`, sets `completedAt = Date.now()`, and clears the active doing state.
