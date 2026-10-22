import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Square,
  Target,
  Trash2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { TodoItem, TodoFilter, TodoPriority } from '../types/todo';
import {
  todoStorageService,
  formatElapsedTime,
} from '../services/todo/todoStorageService';

interface TodoListCardProps {
  active: boolean;
  onClose: () => void;
  onSelectDoingTask?: (item: TodoItem) => void;
  onCompleteTask?: (item: TodoItem) => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const FILTER_TABS: { id: TodoFilter; label: string; countBadge?: (items: TodoItem[]) => number }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active', countBadge: (items) => items.filter((i) => i.status !== 'done').length },
  { id: 'doing', label: 'Doing 🎯', countBadge: (items) => items.filter((i) => i.status === 'in_progress').length },
  { id: 'p1', label: 'Urgent P1 🔥', countBadge: (items) => items.filter((i) => i.priority === 'p1' && i.status !== 'done').length },
  { id: 'done', label: 'Done', countBadge: (items) => items.filter((i) => i.status === 'done').length },
];

export const TodoListCard: React.FC<TodoListCardProps> = ({
  active,
  onClose,
  onSelectDoingTask,
  onCompleteTask,
  onNotify,
}) => {
  const [items, setItems] = useState<TodoItem[]>(() => todoStorageService.getAllItems());
  const [filter, setFilter] = useState<TodoFilter>('active');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rawInput, setRawInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [, setTimerTick] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to reactive storage mutations
  useEffect(() => {
    const unsubscribe = todoStorageService.subscribe(() => {
      setItems(todoStorageService.getAllItems());
    });
    return unsubscribe;
  }, []);

  // Update timer every second for active doing tasks
  useEffect(() => {
    const hasDoing = items.some((i) => i.status === 'in_progress');
    if (!hasDoing) return;

    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'active':
        return items.filter((i) => i.status !== 'done');
      case 'doing':
        return items.filter((i) => i.status === 'in_progress');
      case 'p1':
        return items.filter((i) => i.priority === 'p1' && i.status !== 'done');
      case 'done':
        return items.filter((i) => i.status === 'done');
      case 'all':
      default:
        return items;
    }
  }, [items, filter]);

  // Clamp selected index when filtered list changes
  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(filteredItems.length - 1);
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (!listContainerRef.current) return;
    const activeEl = listContainerRef.current.querySelector(
      `[data-todo-index="${selectedIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Live preview for token parser
  const parsedPreview = useMemo(() => {
    if (!rawInput.trim()) return null;
    return todoStorageService.parseInput(rawInput);
  }, [rawInput]);

  // Handle task submission
  const handleCreateTask = useCallback(() => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    const newItem = todoStorageService.createItem(trimmed);
    setRawInput('');
    setSelectedIndex(0);
    onNotify?.(`Created: "${newItem.title}"`, 'success');
  }, [rawInput, onNotify]);

  // Toggle completion
  const handleToggleItem = useCallback(
    (item: TodoItem) => {
      const updated = todoStorageService.toggleStatus(item.id);
      if (updated?.status === 'done') {
        onNotify?.(`Completed: "${item.title}"`, 'success');
        onCompleteTask?.(item);
      } else {
        onNotify?.(`Restored: "${item.title}"`, 'info');
      }
    },
    [onNotify, onCompleteTask]
  );

  // Toggle Now Doing
  const handleToggleDoing = useCallback(
    (item: TodoItem) => {
      if (item.status === 'in_progress') {
        todoStorageService.stopDoing(item.id);
        onNotify?.(`Stopped focus on: "${item.title}"`, 'info');
      } else {
        const doingItem = todoStorageService.setDoing(item.id);
        if (doingItem) {
          onNotify?.(`Now Doing: "${doingItem.title}" [Live Activity active]`, 'success');
          onSelectDoingTask?.(doingItem);
        }
      }
    },
    [onNotify, onSelectDoingTask]
  );

  // Change priority
  const handleSetPriority = useCallback(
    (item: TodoItem, priority: TodoPriority) => {
      todoStorageService.setPriority(item.id, priority);
      onNotify?.(`Priority set to ${priority.toUpperCase()}`, 'info');
    },
    [onNotify]
  );

  // Delete item
  const handleDeleteItem = useCallback(
    (item: TodoItem) => {
      todoStorageService.deleteItem(item.id);
      onNotify?.(`Deleted task: "${item.title}"`, 'warning');
    },
    [onNotify]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on the input field:
      if (isInputFocused) {
        if (e.key === 'Escape') {
          e.preventDefault();
          inputRef.current?.blur();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCreateTask();
          return;
        }
        if (e.key === 'ArrowDown' && filteredItems.length > 0) {
          e.preventDefault();
          inputRef.current?.blur();
          setSelectedIndex(0);
          return;
        }
        return;
      }

      // If user is navigating list (Input NOT focused):
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
        return;
      }

      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) {
          handleToggleItem(current);
        }
        return;
      }

      if (e.key === 'Enter' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) {
          handleToggleDoing(current);
        }
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) handleSetPriority(current, 'p1');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) handleSetPriority(current, 'p2');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) handleSetPriority(current, 'p3');
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) handleSetPriority(current, 'none');
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'x') {
        e.preventDefault();
        const current = filteredItems[selectedIndex];
        if (current) handleDeleteItem(current);
        return;
      }

      if (e.key === '/' || e.key === 'i') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Filter tabs shortcuts (Tab to cycle filters)
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = FILTER_TABS.findIndex((t) => t.id === filter);
        const nextIndex = (currentIndex + 1) % FILTER_TABS.length;
        setFilter(FILTER_TABS[nextIndex].id);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [
    active,
    isInputFocused,
    filteredItems,
    selectedIndex,
    filter,
    handleCreateTask,
    handleToggleItem,
    handleToggleDoing,
    handleSetPriority,
    handleDeleteItem,
    onClose,
  ]);

  const activeDoingCount = items.filter((i) => i.status === 'in_progress').length;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#000000] text-slate-200 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Header & HUD */}
      <div className="px-5 pt-3 pb-2.5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 flex items-center justify-center">
            <CheckSquare size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-slate-100">
                TODOS & FOCUS
              </span>
              {activeDoingCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 animate-pulse">
                  <Target size={10} /> 1 Now Doing
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Keyboard-first task orchestrator
            </span>
          </div>
        </div>

        {/* Hotkey Guide Bar */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            j/k: nav
          </span>
          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            Space: check
          </span>
          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            Enter/d: Doing
          </span>
          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            1-3: Priority
          </span>
          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            /: Add
          </span>
          <span className="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            Esc: Close
          </span>
        </div>
      </div>

      {/* Quick Input Bar with Smart Token Tagging */}
      <div className="px-5 pt-3 pb-2 shrink-0">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border transition-all ${
            isInputFocused
              ? 'border-cyan-400/50 bg-white/[0.05] shadow-[0_0_20px_rgba(6,182,212,0.15)]'
              : 'border-white/[0.08] hover:border-white/15'
          }`}
        >
          <Plus size={14} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder='Capture task (e.g. "Optimize socket buffer p1 #oxiroute") ...'
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none font-normal"
          />

          {/* Smart Preview Chips */}
          {parsedPreview && (
            <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in duration-150">
              {parsedPreview.priority !== 'none' && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    parsedPreview.priority === 'p1'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : parsedPreview.priority === 'p2'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  }`}
                >
                  {parsedPreview.priority}
                </span>
              )}
              {parsedPreview.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/20"
                >
                  #{tag}
                </span>
              ))}
              <span className="text-[10px] text-slate-400 font-mono">↵ Add</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="px-5 py-1.5 flex items-center justify-between gap-1 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const isTabActive = filter === tab.id;
            const count = tab.countBadge ? tab.countBadge(items) : null;

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isTabActive
                    ? 'bg-white/[0.08] text-white border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <span>{tab.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isTabActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white/[0.04] text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-[10px] font-mono text-slate-400">
          {filteredItems.length} task{filteredItems.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Main Todo Scrollable Item List */}
      <div
        ref={listContainerRef}
        className="flex-1 px-5 py-2.5 overflow-y-auto space-y-1.5 custom-scrollbar"
      >
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
            <CheckCircle2 size={24} className="text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No tasks in this view</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Type above to add a new task or press Tab to switch filters
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSelected = !isInputFocused && selectedIndex === idx;
            const isDoing = item.status === 'in_progress';
            const isDone = item.status === 'done';

            return (
              <div
                key={item.id}
                data-todo-index={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.07] border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : isDoing
                    ? 'bg-amber-500/[0.06] border-amber-400/30'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]'
                }`}
              >
                {/* Left: Checkbox & Doing indicator */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleItem(item);
                    }}
                    className="shrink-0 text-slate-400 hover:text-white transition-colors"
                  >
                    {isDone ? (
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                        <CheckSquare size={13} className="text-emerald-400" />
                      </div>
                    ) : isDoing ? (
                      <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center animate-pulse">
                        <Target size={13} className="text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-white/[0.03] border border-white/[0.15] hover:border-white/30 flex items-center justify-center">
                        <Square size={13} className="text-transparent" />
                      </div>
                    )}
                  </button>

                  {/* Priority Indicator Badge */}
                  {item.priority !== 'none' && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                        item.priority === 'p1'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-400/30'
                          : item.priority === 'p2'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                          : 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                      }`}
                    >
                      {item.priority}
                    </span>
                  )}

                  {/* Task Title & Tags */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium truncate ${
                        isDone
                          ? 'line-through text-slate-400'
                          : isDoing
                          ? 'text-amber-200 font-semibold'
                          : isSelected
                          ? 'text-white'
                          : 'text-slate-200'
                      }`}
                    >
                      {item.title}
                    </p>

                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Timer / Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Elapsed Timer for Doing item */}
                  {isDoing && (
                    <div className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <Clock size={11} className="animate-spin text-amber-400" />
                      <span>{formatElapsedTime(item.doingStartedAt)}</span>
                    </div>
                  )}

                  {/* Now Doing Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDoing(item);
                    }}
                    title={isDoing ? 'Stop focus' : 'Set as Now Doing (Enter/d)'}
                    className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
                      isDoing
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                        : 'bg-white/[0.03] hover:bg-amber-500/10 border-white/[0.08] hover:border-amber-400/30 text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    <Target size={11} />
                    <span className="hidden sm:inline">{isDoing ? 'Doing' : 'Focus'}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item);
                    }}
                    title="Delete task (Backspace)"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="px-5 py-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 shrink-0 bg-black/40">
        <div className="flex items-center gap-2">
          <span>
            {items.filter((i) => i.status === 'done').length} / {items.length} completed
          </span>
          <span className="text-white/20">•</span>
          <button
            onClick={() => todoStorageService.clearCompleted()}
            className="hover:text-rose-400 transition-colors"
          >
            Clear completed
          </button>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <span>Return to Chat</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
};
