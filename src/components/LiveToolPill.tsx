import React, { useState } from 'react';
import {
  Terminal,
  Search,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Mail,
  Calendar,
} from 'lucide-react';
import { ToolExecutionState } from '../types/island';

interface LiveToolPillProps {
  thinking: boolean;
  activeTool?: ToolExecutionState | null;
  thinkingContent?: string;
}

export const LiveToolPill: React.FC<LiveToolPillProps> = ({
  thinking,
  activeTool,
  thinkingContent,
}) => {
  const [isToolExpanded, setIsToolExpanded] = useState(false);
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);

  if (!thinking && !activeTool && !thinkingContent) {
    return null;
  }

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'execute_shell':
        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
      case 'search_files':
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
      case 'read_file':
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
      case 'draft_email':
        return <Mail className="w-3.5 h-3.5 text-slate-400" />;
      case 'draft_calendar_event':
        return <Calendar className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getToolSummary = (name: string, args: Record<string, unknown>) => {
    if (args.command) return String(args.command);
    if (args.pattern) return `search: "${args.pattern}"`;
    if (args.path) return `read: "${args.path}"`;
    if (args.title) return `event: "${args.title}"`;
    if (args.subject) return `email: "${args.subject}"`;
    return name;
  };

  return (
    <div className="mb-3 space-y-2 select-none">
      {/* 1. Minimal Thought / Reasoning Block */}
      {(thinking || thinkingContent) && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors overflow-hidden">
          <div
            onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
            className="flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={13} className="text-purple-400 shrink-0 animate-pulse" />
              <span className="font-medium text-slate-300">
                {thinking ? 'Thinking...' : 'Thought process'}
              </span>
              {thinking && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              )}
            </div>
            <div className="text-slate-500 hover:text-slate-300">
              {isThoughtExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
          </div>

          {isThoughtExpanded && (
            <div className="px-3.5 py-2.5 border-t border-white/[0.04] bg-black/40 text-[11px] text-slate-400 font-sans leading-relaxed">
              {thinkingContent || 'Analyzing query, checking available tools, and generating structured solution...'}
            </div>
          )}
        </div>
      )}

      {/* 2. Minimal Tool Execution Pill & Accordion */}
      {activeTool && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors overflow-hidden">
          <div
            onClick={() => setIsToolExpanded(!isToolExpanded)}
            className="flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="shrink-0">{getToolIcon(activeTool.name)}</div>
              <span className="font-mono text-slate-200 text-[11px] font-semibold">
                {activeTool.name}
              </span>
              <span className="font-mono text-[11px] text-slate-400 truncate max-w-[360px]">
                {getToolSummary(activeTool.name, activeTool.arguments)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {activeTool.status === 'running' ? (
                <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-400/20">
                  <span className="w-1 h-1 rounded-full bg-sky-400 animate-ping" />
                  Running
                </span>
              ) : activeTool.status === 'completed' ? (
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-400/20">
                  ✓ {activeTool.durationMs ? `${activeTool.durationMs}ms` : 'Done'}
                </span>
              ) : activeTool.status === 'failed' ? (
                <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-400/20">
                  ✕ Error
                </span>
              ) : null}

              <div className="text-slate-500 hover:text-slate-300">
                {isToolExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </div>
          </div>

          {isToolExpanded && (
            <div className="p-3 border-t border-white/[0.04] bg-black/60 font-mono text-[11px] text-slate-300 space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  Parameters:
                </span>
                <pre className="p-2 rounded-lg bg-black/40 border border-white/[0.04] text-slate-300 leading-relaxed overflow-x-auto">
                  {JSON.stringify(activeTool.arguments, null, 2)}
                </pre>
              </div>

              {activeTool.result && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Output:
                  </span>
                  <pre className="p-2 rounded-lg bg-black/40 border border-white/[0.04] text-emerald-300/90 max-h-36 overflow-y-auto leading-relaxed">
                    {activeTool.result}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
