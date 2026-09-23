import React, { useState } from 'react';
import {
  History,
  Plus,
  Trash2,
  Search,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Check,
} from 'lucide-react';
import { SessionRecord } from '../types/commands';

interface HistoryDrawerProps {
  sessions: SessionRecord[];
  activeSessionId: string;
  onSelectSession: (session: SessionRecord) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClose: () => void;
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

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const titleMatch = s.title.toLowerCase().includes(q);
    const contentMatch = s.messages.some((m) => m.content.toLowerCase().includes(q));
    return titleMatch || contentMatch;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#000000] text-slate-100 select-none overflow-hidden">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Back to conversation"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <History size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold tracking-tight text-white">
              Session History
            </span>
          </div>
        </div>

        {/* Action Button: Start New Session */}
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/20 hover:border-cyan-400/40 text-xs font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus size={14} />
          <span>New Session</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] bg-black/40">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl focus-within:border-cyan-400/40 focus-within:bg-white/[0.06] transition-all">
          <Search size={14} className="text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past conversations..."
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-slate-500 hover:text-white px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <MessageSquare size={26} className="text-slate-600" />
            <p>No conversation history found.</p>
            {searchQuery && (
              <span className="text-[11px] text-slate-600">
                No sessions match &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const messageCount = session.messages.filter((m) => m.role !== 'system').length;
            const lastUserMsg = session.messages.slice().reverse().find((m) => m.role === 'user');

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group relative flex items-start justify-between p-3 rounded-2xl cursor-pointer border transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.08] border-cyan-400/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {isActive ? <Check size={14} /> : <MessageSquare size={14} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {session.title || 'Untitled Session'}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    {lastUserMsg && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {lastUserMsg.content}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatRelativeTime(session.updatedAt || session.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{messageCount} message{messageCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action: Delete */}
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deletingId === session.id ? (
                    <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-lg p-1 text-[10px] text-rose-400">
                      <span>Delete?</span>
                      <button
                        onClick={() => {
                          onDeleteSession(session.id);
                          setDeletingId(null);
                        }}
                        className="px-1.5 py-0.5 bg-rose-500 text-white rounded font-medium hover:bg-rose-600"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-1 text-slate-400 hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(session.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[11px] text-slate-400">
        <span>{sessions.length} total stored sessions</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Press Esc to close
        </button>
      </div>
    </div>
  );
};
