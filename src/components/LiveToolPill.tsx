import React from 'react';
import { Terminal, Search, FileText, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToolExecutionState } from '../types/island';

interface LiveToolPillProps {
  thinking: boolean;
  activeTool?: ToolExecutionState | null;
}

export const LiveToolPill: React.FC<LiveToolPillProps> = ({ thinking, activeTool }) => {
  if (!thinking && !activeTool) {
    return null;
  }

  // Thinking State
  if (thinking && (!activeTool || activeTool.status === 'pending')) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-sky-400/30 text-sky-200 text-xs font-medium animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.25)] select-none">
        <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '3s' }} />
        <span>Mavis is thinking...</span>
      </div>
    );
  }

  if (!activeTool) return null;

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'execute_shell':
        return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      case 'search_files':
        return <Search className="w-3.5 h-3.5 text-cyan-400" />;
      case 'read_file':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getToolLabel = (name: string, args: Record<string, unknown>) => {
    switch (name) {
      case 'execute_shell':
        return `Running: ${String(args.command || '').slice(0, 32)}`;
      case 'search_files':
        return `Searching: ${String(args.pattern || '')}`;
      case 'read_file':
        return `Reading: ${String(args.path || '').split('/').pop()}`;
      case 'draft_email':
        return `Drafting email to ${String(args.to || '')}`;
      case 'draft_calendar_event':
        return `Drafting event: ${String(args.title || '')}`;
      default:
        return `Executing: ${name}`;
    }
  };

  const isRunning = activeTool.status === 'running';
  const isCompleted = activeTool.status === 'completed';
  const isFailed = activeTool.status === 'failed';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono transition-all duration-200 select-none ${
        isRunning
          ? 'bg-sky-500/10 border border-sky-400/40 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
          : isCompleted
          ? 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-200'
          : isFailed
          ? 'bg-red-500/10 border border-red-400/30 text-red-200'
          : 'bg-white/5 border border-white/10 text-gray-300'
      }`}
    >
      {isRunning && (
        <div className="flex items-center gap-1.5">
          {getToolIcon(activeTool.name)}
          <span className="font-sans font-medium">{getToolLabel(activeTool.name, activeTool.arguments)}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping ml-0.5" />
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-sans font-medium">{getToolLabel(activeTool.name, activeTool.arguments)}</span>
          {activeTool.durationMs && (
            <span className="text-[10px] text-emerald-400/70 font-mono">({activeTool.durationMs}ms)</span>
          )}
        </div>
      )}

      {isFailed && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="font-sans font-medium">Failed: {activeTool.name}</span>
        </div>
      )}
    </div>
  );
};
