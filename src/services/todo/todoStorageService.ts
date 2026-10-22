import {
  TodoItem,
  TodoPriority,
  ParsedTodoInput,
} from '../../types/todo';

const STORAGE_KEY = 'mavis_voice_island_todos_v1';

export function parseNaturalTodoInput(rawInput: string): ParsedTodoInput {
  let text = rawInput.trim();
  let priority: TodoPriority = 'none';
  const tags: string[] = [];

  // 1. Extract hashtags: #tag
  const tagMatches = text.match(/#([a-zA-Z0-9_\u0600-\u06FF\-]+)/g);
  if (tagMatches) {
    for (const tagWithHash of tagMatches) {
      const cleanTag = tagWithHash.slice(1).trim();
      if (cleanTag && !tags.includes(cleanTag)) {
        tags.push(cleanTag);
      }
    }
    text = text.replace(/#([a-zA-Z0-9_\u0600-\u06FF\-]+)/g, '').trim();
  }

  // 2. Extract priority tokens: p1, p2, p3, !1, !2, !3, urgent, medium, low
  // Note: Persian words like فوری do not match ASCII \b, so we use unicode boundaries
  const p1Regex = /(?:^|[^\p{L}\p{N}])(p1|!1|urgent|فوری)(?:[^\p{L}\p{N}]|$)/iu;
  const p2Regex = /(?:^|[^\p{L}\p{N}])(p2|!2|medium|مهم)(?:[^\p{L}\p{N}]|$)/iu;
  const p3Regex = /(?:^|[^\p{L}\p{N}])(p3|!3|low|عادی)(?:[^\p{L}\p{N}]|$)/iu;

  if (p1Regex.test(text)) {
    priority = 'p1';
    text = text.replace(/(?:^|[^\p{L}\p{N}])(p1|!1|urgent|فوری)(?:[^\p{L}\p{N}]|$)/giu, ' ').trim();
  } else if (p2Regex.test(text)) {
    priority = 'p2';
    text = text.replace(/(?:^|[^\p{L}\p{N}])(p2|!2|medium|مهم)(?:[^\p{L}\p{N}]|$)/giu, ' ').trim();
  } else if (p3Regex.test(text)) {
    priority = 'p3';
    text = text.replace(/(?:^|[^\p{L}\p{N}])(p3|!3|low|عادی)(?:[^\p{L}\p{N}]|$)/giu, ' ').trim();
  }

  // Clean double spaces and punctuation leftovers
  const cleanedTitle = text.replace(/\s+/g, ' ').trim();

  return {
    title: cleanedTitle || rawInput.trim(),
    priority,
    tags,
  };
}

export function formatElapsedTime(startedAt?: number): string {
  if (!startedAt) return '0m';
  const elapsedMs = Math.max(0, Date.now() - startedAt);
  const totalMinutes = Math.floor(elapsedMs / 60000);
  if (totalMinutes < 1) {
    const seconds = Math.floor(elapsedMs / 1000);
    return `${seconds}s`;
  }
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

class TodoStorageService {
  private items: TodoItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TodoItem[];
          if (Array.isArray(parsed)) {
            this.items = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[TodoStorageService] Failed to load todos:', e);
      this.items = [];
    }

    // Starter initial sample if empty
    if (this.items.length === 0) {
      this.items = [
        {
          id: `todo-${Date.now()}-1`,
          title: 'Review Mavis voice overlay & spring physics',
          status: 'in_progress',
          priority: 'p1',
          tags: ['mavis', 'core'],
          createdAt: Date.now() - 1000 * 60 * 18,
          doingStartedAt: Date.now() - 1000 * 60 * 18,
        },
        {
          id: `todo-${Date.now()}-2`,
          title: 'Optimize Oxiroute gateway latency & buffer reuse',
          status: 'todo',
          priority: 'p1',
          tags: ['oxiroute', 'rust'],
          createdAt: Date.now() - 1000 * 60 * 60,
        },
        {
          id: `todo-${Date.now()}-3`,
          title: 'Refactor Khales Room SQLCipher database migration',
          status: 'todo',
          priority: 'p2',
          tags: ['khales', 'android'],
          createdAt: Date.now() - 1000 * 60 * 120,
        },
      ];
      this.persist();
    }
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      }
    } catch (e) {
      console.warn('[TodoStorageService] Failed to persist todos:', e);
    }
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('[TodoStorageService] Listener notification error:', err);
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getAllItems(): TodoItem[] {
    const priorityWeights: Record<TodoPriority, number> = {
      p1: 4,
      p2: 3,
      p3: 2,
      none: 1,
    };

    return [...this.items].sort((a, b) => {
      // 1. Doing tasks first
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

      // 2. Pending before Completed
      if (a.status === 'todo' && b.status === 'done') return -1;
      if (b.status === 'todo' && a.status === 'done') return 1;

      // 3. For both pending, sort by priority DESC, then newest createdAt DESC
      if (a.status === 'todo' && b.status === 'todo') {
        const pDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
        if (pDiff !== 0) return pDiff;
        return b.createdAt - a.createdAt;
      }

      // 4. For both completed, newest completedAt DESC
      if (a.status === 'done' && b.status === 'done') {
        return (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt);
      }

      return b.createdAt - a.createdAt;
    });
  }

  public getActiveDoingItem(): TodoItem | null {
    return this.items.find((item) => item.status === 'in_progress') || null;
  }

  public createItem(rawInput: string): TodoItem {
    const parsed = parseNaturalTodoInput(rawInput);
    const newItem: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: parsed.title,
      status: 'todo',
      priority: parsed.priority,
      tags: parsed.tags,
      createdAt: Date.now(),
    };

    this.items.unshift(newItem);
    this.persist();
    return newItem;
  }

  public toggleStatus(id: string): TodoItem | null {
    const target = this.items.find((item) => item.id === id);
    if (!target) return null;

    if (target.status === 'done') {
      target.status = 'todo';
      delete target.completedAt;
    } else {
      // Was todo or in_progress -> mark done
      target.status = 'done';
      target.completedAt = Date.now();
    }

    this.persist();
    return target;
  }

  public setDoing(id: string): TodoItem | null {
    const target = this.items.find((item) => item.id === id);
    if (!target) return null;

    // Demote any previously doing item to todo
    for (const item of this.items) {
      if (item.id !== id && item.status === 'in_progress') {
        item.status = 'todo';
      }
    }

    target.status = 'in_progress';
    target.doingStartedAt = Date.now();
    delete target.completedAt;

    this.persist();
    return target;
  }

  public stopDoing(id: string): void {
    const target = this.items.find((item) => item.id === id);
    if (target && target.status === 'in_progress') {
      target.status = 'todo';
      this.persist();
    }
  }

  public setPriority(id: string, priority: TodoPriority): void {
    const target = this.items.find((item) => item.id === id);
    if (target) {
      target.priority = priority;
      this.persist();
    }
  }

  public deleteItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.persist();
  }

  public clearCompleted(): void {
    this.items = this.items.filter((item) => item.status !== 'done');
    this.persist();
  }

  public parseInput(rawInput: string): ParsedTodoInput {
    return parseNaturalTodoInput(rawInput);
  }
}

export const todoStorageService = new TodoStorageService();
