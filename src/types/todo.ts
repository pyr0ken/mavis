export type TodoPriority = 'p1' | 'p2' | 'p3' | 'none';

export type TodoStatus = 'todo' | 'in_progress' | 'done';

export type TodoFilter = 'all' | 'active' | 'doing' | 'done' | 'p1';

export interface TodoItem {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  tags: string[];
  createdAt: number;
  completedAt?: number;
  doingStartedAt?: number;
}

export interface TodoStorageState {
  items: TodoItem[];
  activeDoingId?: string | null;
}

export interface ParsedTodoInput {
  title: string;
  priority: TodoPriority;
  tags: string[];
}
