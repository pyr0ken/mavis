import React, { useState, useEffect } from 'react';
import { Target, Check, Clock } from 'lucide-react';
import { TodoItem } from '../types/todo';
import { formatElapsedTime } from '../services/todo/todoStorageService';

interface AmbientNowDoingProps {
  activeItem: TodoItem;
  onOpenTodoCard: () => void;
  onQuickComplete: (item: TodoItem) => void;
}

export const AmbientNowDoing: React.FC<AmbientNowDoingProps> = ({
  activeItem,
  onOpenTodoCard,
  onQuickComplete,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeItem.doingStartedAt]);

  const elapsedTime = formatElapsedTime(activeItem.doingStartedAt);

  return (
    <div
      onClick={onOpenTodoCard}
      className="flex-1 flex items-center justify-between px-2.5 h-full cursor-pointer select-none group transition-all"
    >
      {/* Left: Glowing Pulsing Now Doing Target Icon */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.35)]">
            <Target size={13} className="text-amber-400 animate-spin-slow" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Center: Task Title & Live Elapsed Timer */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-100 group-hover:text-amber-200 transition-colors truncate max-w-[190px]">
            {activeItem.title}
          </span>

          <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[10px] font-mono font-medium text-amber-300">
            <Clock size={10} className="text-amber-400" />
            <span>{elapsedTime}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Complete Check Action Button */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickComplete(activeItem);
          }}
          title="Mark complete & close (Space/Check)"
          className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 flex items-center justify-center text-slate-300 hover:text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <Check size={13} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
