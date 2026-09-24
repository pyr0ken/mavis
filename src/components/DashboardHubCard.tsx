import React from 'react';
import {
  MessageSquare,
  Search,
  FileText,
  Calendar,
  Cpu,
  Wrench,
  ArrowRight,
  HardDrive,
  Sparkles,
  Layers,
  History,
  CheckCircle2,
} from 'lucide-react';
import { SessionRecord, SlashCommand } from '../types/commands';

interface DashboardHubCardProps {
  sessions: SessionRecord[];
  activeModelName?: string;
  onSelectSession: (session: SessionRecord) => void;
  onOpenHistory: () => void;
  onExecuteCommand: (cmd: SlashCommand) => void;
  onInjectPrompt: (prompt: string, autoSubmit?: boolean) => void;
}

const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const DashboardHubCard: React.FC<DashboardHubCardProps> = ({
  sessions,
  activeModelName = 'Antigravity / Hybrid Core',
  onSelectSession,
  onOpenHistory,
  onInjectPrompt,
}) => {
  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#000000] text-slate-200 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Main 2-Column Dashboard Grid */}
      <div className="flex-1 px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto custom-scrollbar">
        {/* Left Column (5 Cols): Recent Conversations & Resume */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300">
                <History size={14} className="text-cyan-400" />
                <span>RECENTS & RESUME</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                {sessions.length} saved
              </span>
            </div>

            {/* Session Items */}
            <div className="space-y-1.5">
              {recentSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-2">
                  <MessageSquare size={20} className="text-slate-500" />
                  <p>No recent conversation history.</p>
                  <span className="text-[11px] text-slate-400">Type a message above or press / for skills</span>
                </div>
              ) : (
                recentSessions.map((sess) => {
                  const messageCount = sess.messages.filter((m) => m.role !== 'system').length;
                  const lastUserMsg = sess.messages.slice().reverse().find((m) => m.role === 'user');

                  return (
                    <div
                      key={sess.id}
                      onClick={() => onSelectSession(sess)}
                      className="group flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-400/30 cursor-pointer transition-all duration-150 active:scale-[0.99]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 border border-cyan-400/20 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                        <MessageSquare size={13} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-100 group-hover:text-white truncate">
                            {sess.title || 'Untitled Session'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {formatRelativeTime(sess.updatedAt || sess.createdAt)}
                          </span>
                        </div>

                        {lastUserMsg && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {lastUserMsg.content}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="bg-white/[0.04] px-1.5 py-0.2 rounded text-slate-400">
                            {messageCount} msg{messageCount === 1 ? '' : 's'}
                          </span>
                          <span className="text-cyan-400/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Resume <ArrowRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* View Full History Button */}
          {sessions.length > 0 && (
            <button
              onClick={onOpenHistory}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/15 text-xs text-slate-300 hover:text-white font-medium transition-all"
            >
              <History size={13} />
              <span>Browse All Sessions (Ctrl+H)</span>
            </button>
          )}
        </div>

        {/* Right Column (7 Cols): Quick Actions & System Vital HUD */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          {/* Quick Actions Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300">
                <Sparkles size={14} className="text-purple-400" />
                <span>QUICK AGENT WORKFLOWS</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Click to launch</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Action 1: Search Files */}
              <div
                onClick={() =>
                  onInjectPrompt('Search files modified in the last 24 hours: ')
                }
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-400/30 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Search size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Search Files
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Local workspace search
                  </span>
                </div>
              </div>

              {/* Action 2: Run Command */}
              <div
                onClick={() =>
                  onInjectPrompt('Execute terminal command: ')
                }
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-400/30 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Run Command
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Shell & bash execution
                  </span>
                </div>
              </div>

              {/* Action 3: Inspect Files */}
              <div
                onClick={() =>
                  onInjectPrompt('Read and analyze the file: ')
                }
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-teal-400/30 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Inspect File
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Read file contents
                  </span>
                </div>
              </div>

              {/* Action 4: Today's Schedule */}
              <div
                onClick={() =>
                  onInjectPrompt('Show my calendar agenda and meetings for today', true)
                }
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-400/30 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Today&apos;s Agenda
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Calendar & schedules
                  </span>
                </div>
              </div>

              {/* Action 5: MCP Status */}
              <div
                onClick={() =>
                  onInjectPrompt('List all active MCP servers, connected tools, and connection health status.', true)
                }
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-400/30 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Cpu size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    MCP Status
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Inspect active servers
                  </span>
                </div>
              </div>

              {/* Action 6: ReAct Tools */}
              <div
                onClick={() =>
                  onInjectPrompt('Display the catalog of local system tools available to the ReAct engine.', true)
                }
                className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-purple-400/30 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Layers size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    System Tools
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Shell & SQLite tools
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System & Agent Vital Stats Card */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Layers size={13} className="text-cyan-400" />
                <span>ACTIVE AGENT ENVIRONMENT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400">Ready</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-purple-400 shrink-0" />
                <span className="text-slate-400 truncate">Model:</span>
                <span className="text-slate-200 font-semibold truncate">{activeModelName}</span>
              </div>

              <div className="flex items-center gap-2">
                <HardDrive size={12} className="text-sky-400 shrink-0" />
                <span className="text-slate-400 truncate">OS:</span>
                <span className="text-slate-200 font-medium truncate">Arch Linux (KDE)</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span className="text-slate-400 truncate">SecondBrain:</span>
                <span className="text-slate-200 font-medium truncate">Mounted</span>
              </div>

              <div className="flex items-center gap-2">
                <Cpu size={12} className="text-amber-400 shrink-0" />
                <span className="text-slate-400 truncate">ReAct Engine:</span>
                <span className="text-slate-200 font-medium truncate">Native Tools Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Footer Bar */}
      <div className="px-6 py-2.5 border-t border-white/[0.08] bg-black/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">↵</kbd>
            Ask Anything
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-cyan-300 border border-cyan-400/30 font-bold">/</kbd>
            Slash Commands
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">Ctrl+H</kbd>
            History
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">Ctrl+Space</kbd>
          Toggle
        </div>
      </div>
    </div>
  );
};
