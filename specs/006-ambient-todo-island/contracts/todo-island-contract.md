# Contract: Todo Storage Service & Island Integration Protocol

**Feature**: `specs/006-ambient-todo-island`  
**Date**: 2026-10-04  
**Status**: Completed  

---

## 1. Todo Storage Service Contract

```typescript
import { TodoItem, TodoPriority, TodoStatus } from '../../types/todo';

export interface ITodoStorageService {
  /**
   * Retrieves all todo items ordered by:
   * 1. In Progress first
   * 2. Pending Todo items (P1 > P2 > P3 > None, then newest first)
   * 3. Completed items (newest completed first)
   */
  getAllItems(): TodoItem[];

  /**
   * Retrieves the currently active doing item, if any.
   */
  getActiveDoingItem(): TodoItem | null;

  /**
   * Creates a new todo item by parsing a raw natural language string.
   * e.g., "Fix socket buffer p1 #oxiroute"
   */
  createItem(rawInput: string): TodoItem;

  /**
   * Toggles an item between Done and Pending (or stops doing if currently doing).
   */
  toggleStatus(id: string): TodoItem | null;

  /**
   * Marks a specific item as 'in_progress' and starts its elapsed timer.
   * Any previously 'in_progress' item is reverted to 'todo'.
   */
  setDoing(id: string): TodoItem | null;

  /**
   * Stops 'in_progress' on a specific item and reverts it to 'todo'.
   */
  stopDoing(id: string): void;

  /**
   * Updates an item's priority level.
   */
  setPriority(id: string, priority: TodoPriority): void;

  /**
   * Deletes a todo item permanently.
   */
  deleteItem(id: string): void;

  /**
   * Clears all completed items.
   */
  clearCompleted(): void;

  /**
   * Subscribes a listener to any state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void;

  /**
   * Utility parser for extracting tokens from natural input.
   */
  parseInput(rawInput: string): {
    title: string;
    priority: TodoPriority;
    tags: string[];
  };
}
```

---

## 2. Ambient Now Doing Component Contract

```typescript
export interface AmbientNowDoingProps {
  activeItem: TodoItem;
  onOpenTodoCard: () => void;
  onQuickComplete: (item: TodoItem) => void;
}
```

---

## 3. Todo Action Card Component Contract

```typescript
export interface TodoListCardProps {
  active: boolean;
  onClose: () => void;
  onSelectDoingTask?: (item: TodoItem) => void;
  onCompleteTask?: (item: TodoItem) => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}
```
