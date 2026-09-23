import React, { useEffect, useRef } from 'react';
import {
  Plus,
  History,
  Trash2,
  Minimize2,
  Sliders,
  HelpCircle,
  Sparkles,
  Zap,
  Compass,
  HardDrive,
  Code,
  FileText,
  Bug,
  CheckCircle2,
  Cpu,
  Wrench,
  Terminal,
  CornerDownLeft,
} from 'lucide-react';
import { SlashCommand, CommandCategory } from '../types/commands';

interface SlashCommandPaletteProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelectCommand: (command: SlashCommand) => void;
  onHoverIndex: (index: number) => void;
  searchQuery?: string;
}

const CATEGORY_METADATA: Record<
  CommandCategory,
  { label: string; badgeColor: string; textColor: string }
> = {
  system: {
    label: 'SYSTEM COMMANDS',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    textColor: 'text-emerald-400',
  },
  model: {
    label: 'MODELS & ENGINES',
    badgeColor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    textColor: 'text-purple-400',
  },
  skill: {
    label: 'AGENT SKILLS & WORKFLOWS',
    badgeColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    textColor: 'text-cyan-400',
  },
  mcp: {
    label: 'INTEGRATIONS & MCP TOOLS',
    badgeColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    textColor: 'text-amber-400',
  },
};

const renderIcon = (iconName: string) => {
  const iconProps = { size: 16, className: 'shrink-0' };
  switch (iconName) {
    case 'Plus':
      return <Plus {...iconProps} className="text-emerald-400" />;
    case 'History':
      return <History {...iconProps} className="text-indigo-400" />;
    case 'Trash2':
      return <Trash2 {...iconProps} className="text-rose-400" />;
    case 'Minimize2':
      return <Minimize2 {...iconProps} className="text-amber-400" />;
    case 'Sliders':
      return <Sliders {...iconProps} className="text-slate-300" />;
    case 'HelpCircle':
      return <HelpCircle {...iconProps} className="text-blue-400" />;
    case 'Sparkles':
      return <Sparkles {...iconProps} className="text-purple-400" />;
    case 'Zap':
      return <Zap {...iconProps} className="text-yellow-400" />;
    case 'Compass':
      return <Compass {...iconProps} className="text-blue-400" />;
    case 'HardDrive':
      return <HardDrive {...iconProps} className="text-slate-400" />;
    case 'Code':
      return <Code {...iconProps} className="text-cyan-400" />;
    case 'FileText':
      return <FileText {...iconProps} className="text-teal-400" />;
    case 'Bug':
      return <Bug {...iconProps} className="text-rose-400" />;
    case 'CheckCircle2':
      return <CheckCircle2 {...iconProps} className="text-emerald-400" />;
    case 'Cpu':
      return <Cpu {...iconProps} className="text-amber-400" />;
    case 'Wrench':
      return <Wrench {...iconProps} className="text-sky-400" />;
    default:
      return <Terminal {...iconProps} className="text-slate-400" />;
  }
};

export const SlashCommandPalette: React.FC<SlashCommandPaletteProps> = ({
  commands,
  selectedIndex,
  onSelectCommand,
  onHoverIndex,
  searchQuery = '',
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  // Auto scroll handling with wrap-around
  useEffect(() => {
    if (!listRef.current || commands.length === 0) return;

    if (selectedIndex === 0) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (selectedIndex === commands.length - 1) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      return;
    }

    const activeEl = itemRefs.current[selectedIndex];
    if (activeEl) {
      activeEl.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, commands.length]);

  const handleItemMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    // Prevent stationary mouse hover from stealing focus when list scrolls underneath it
    const lastX = lastMousePosRef.current.x;
    const lastY = lastMousePosRef.current.y;
    const currentX = e.clientX;
    const currentY = e.clientY;

    if (lastX !== -1 && lastY !== -1) {
      const deltaX = Math.abs(currentX - lastX);
      const deltaY = Math.abs(currentY - lastY);
      // Only switch hover index if the mouse was genuinely moved by the user (>3px)
      if (deltaX < 3 && deltaY < 3) {
        return;
      }
    }

    lastMousePosRef.current = { x: currentX, y: currentY };
    onHoverIndex(index);
  };

  const categories: CommandCategory[] = ['system', 'model', 'skill', 'mcp'];
  let globalIndexCounter = 0;

  return (
    <div
      className="w-full h-full flex flex-col bg-[#000000] select-none text-slate-200 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Palette Bar Header with Search Query & Counter */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono font-bold text-xs">
            /
          </div>
          <span className="font-semibold text-white tracking-tight">Command Palette & Skills</span>
          {searchQuery && (
            <div className="flex items-center gap-1 bg-white/10 text-cyan-300 px-2 py-0.5 rounded-md text-[11px] font-mono border border-white/10">
              <span>filter:</span>
              <span className="font-semibold text-white">{searchQuery}</span>
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
          {commands.length} command{commands.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Main Integrated Palette Body */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-3.5 space-y-4 custom-scrollbar"
      >
        {commands.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Terminal size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-slate-200">No matching commands found for &ldquo;/{searchQuery}&rdquo;</p>
              <p className="text-[11px] text-slate-500 mt-1">Try typing &quot;/new&quot;, &quot;/model:claude&quot;, or &quot;/skill:plan&quot;</p>
            </div>
          </div>
        ) : (
          categories.map((cat) => {
            const groupCommands = commands.filter((c) => c.category === cat);
            if (groupCommands.length === 0) return null;

            const meta = CATEGORY_METADATA[cat];

            return (
              <div key={cat} className="space-y-1.5">
                {/* Category Section Header */}
                <div className="px-1 py-1 text-[11px] font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{meta.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.badgeColor} font-mono`}>
                    {groupCommands.length}
                  </span>
                </div>

                {/* Grid of Command Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {groupCommands.map((cmd) => {
                    const itemGlobalIndex = globalIndexCounter++;
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <div
                        key={cmd.id}
                        ref={(el) => {
                          itemRefs.current[itemGlobalIndex] = el;
                        }}
                        onMouseMove={(e) => handleItemMouseMove(e, itemGlobalIndex)}
                        onClick={() => onSelectCommand(cmd)}
                        className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all duration-150 ${
                          isSelected
                            ? 'bg-white/[0.09] text-white border-cyan-400/40 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-cyan-400/30'
                            : 'bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400/40 shadow-sm scale-105'
                                : 'bg-white/[0.04] border-white/[0.08] group-hover:border-white/15'
                            }`}
                          >
                            {renderIcon(cmd.icon)}
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isSelected ? 'text-white' : 'text-slate-100 group-hover:text-white'
                                }`}
                              >
                                {cmd.label}
                              </span>
                              <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/15 border border-cyan-400/25 px-1.5 py-0.2 rounded">
                                {cmd.prefix}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 truncate mt-0.5 group-hover:text-slate-300">
                              {cmd.description}
                            </span>
                          </div>
                        </div>

                        {/* Right: Shortcut or Enter Button */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {cmd.shortcut && (
                            <span className="text-[10px] font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-lg border border-white/[0.08]">
                              {cmd.shortcut}
                            </span>
                          )}
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-200 bg-cyan-500/25 px-2.5 py-1 rounded-xl border border-cyan-400/40 shadow-sm animate-in fade-in zoom-in-95 duration-100">
                              <CornerDownLeft size={12} />
                              Run
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Integrated Palette Footer */}
      <div className="px-6 py-2.5 border-t border-white/[0.08] bg-black/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">↑ ↓ ← →</kbd>
            Cross-Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">↵</kbd>
            Execute
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">Tab</kbd>
            Autocomplete
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono text-[10px] text-slate-300 border border-white/10">Esc</kbd>
          Dismiss
        </div>
      </div>
    </div>
  );
};
