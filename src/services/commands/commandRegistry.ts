import { SlashCommand, CommandCategory } from '../../types/commands';

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateFuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (!q || !t) return 0;

  // 1. Exact match
  if (t === q) return 1000;

  // 2. Starts with query (Prefix match)
  if (t.startsWith(q)) {
    return 700 + Math.max(0, 50 - t.length);
  }

  // 3. Substring match
  const subIdx = t.indexOf(q);
  if (subIdx !== -1) {
    return 450 - subIdx * 10;
  }

  // 4. Fuzzy Subsequence Match
  let qIdx = 0;
  let score = 0;
  let consecutive = 0;
  let prevMatchIdx = -2;

  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++;
      let charScore = 30;

      if (tIdx === 0 || /[\s\-_:/]/.test(t[tIdx - 1])) {
        charScore += 50;
      }

      if (tIdx === prevMatchIdx + 1) {
        consecutive++;
        charScore += consecutive * 25;
      } else {
        consecutive = 0;
      }

      prevMatchIdx = tIdx;
      score += charScore;
    }
  }

  if (qIdx === q.length) {
    return score + 150;
  }

  if (q.length >= 3) {
    const dist = levenshteinDistance(q, t);
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - dist / maxLen;
    if (dist <= 2 && similarity >= 0.55) {
      return Math.round(similarity * 180);
    }
  }

  return 0;
}

export class CommandRegistry {
  private baseCommands: SlashCommand[] = [];

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    const defaults: SlashCommand[] = [
      // 1. System Commands
      {
        id: 'cmd-new',
        prefix: '/new',
        label: 'New Session',
        description: 'Archive current conversation and start clean session',
        category: 'system',
        icon: 'Plus',
        shortcut: 'Ctrl+N',
        keywords: ['new', 'nw', 'fresh', 'create', 'start', 'clean', 'reset'],
        execute: (ctx) => {
          ctx.startNewSession();
        },
      },
      {
        id: 'cmd-history',
        prefix: '/history',
        label: 'Session History',
        description: 'Browse, switch, or manage past conversations',
        category: 'system',
        icon: 'History',
        shortcut: 'Ctrl+H',
        keywords: ['history', 'hist', 'sessions', 'past', 'threads', 'logs', 'archive', 'search'],
        execute: (ctx) => {
          ctx.openHistory();
        },
      },
      {
        id: 'cmd-clear',
        prefix: '/clear',
        label: 'Clear Canvas & Reset',
        description: 'Save current chat to history and open fresh dashboard',
        category: 'system',
        icon: 'Trash2',
        shortcut: 'Ctrl+L',
        keywords: ['clear', 'clean', 'wipe', 'empty', 'reset'],
        execute: (ctx) => {
          ctx.clearMessages();
        },
      },
      {
        id: 'cmd-compact',
        prefix: '/compact',
        label: 'Compact Context',
        description: 'Summarize and compress conversation to save token memory',
        category: 'system',
        icon: 'Minimize2',
        keywords: ['compact', 'summarize', 'compress', 'reduce', 'tokens', 'memory'],
        execute: (ctx) => {
          ctx.compactContext();
        },
      },
      {
        id: 'cmd-settings',
        prefix: '/settings',
        label: 'Overlay Preferences',
        description: 'Configure shortcut bindings, speech synthesis, and appearance',
        category: 'system',
        icon: 'Sliders',
        keywords: ['settings', 'config', 'options', 'theme', 'shortcuts', 'voice'],
        execute: (ctx) => {
          ctx.showNotification('Shortcut: Ctrl+Space (Toggle) | Ctrl+Alt (Instant)', 'info');
        },
      },
      {
        id: 'cmd-help',
        prefix: '/help',
        label: 'Help & Shortcuts',
        description: 'Overview of slash commands, native tools, and gestures',
        category: 'system',
        icon: 'HelpCircle',
        keywords: ['help', 'guide', 'docs', 'manual', 'shortcuts'],
        execute: (ctx) => {
          ctx.showNotification('Type / to filter commands, Arrow keys to navigate, Enter to run', 'info');
        },
      },

      // 2. Integrations & Native MCP Tools
      {
        id: 'cmd-mcp-status',
        prefix: '/mcp:status',
        label: 'MCP Server Status',
        description: 'View connected Model Context Protocol servers & latency',
        category: 'mcp',
        icon: 'Cpu',
        keywords: ['mcp', 'servers', 'protocol', 'connections', 'bridge'],
        execute: (ctx) => {
          ctx.injectPrompt('List all active MCP servers, connected tools, and connection health status.', true);
        },
      },
      {
        id: 'cmd-tools-list',
        prefix: '/tools:list',
        label: 'System ReAct Tools',
        description: 'Inspect local bash, SQLite, and filesystem tool schemas',
        category: 'mcp',
        icon: 'Wrench',
        keywords: ['tools', 'bash', 'functions', 'schemas', 'system'],
        execute: (ctx) => {
          ctx.injectPrompt('Display the catalog of local system tools available to the ReAct engine.', true);
        },
      },
    ];

    this.baseCommands = defaults;
  }

  public getAllCommands(): SlashCommand[] {
    const categoryOrder: CommandCategory[] = ['system', 'mcp'];
    const sorted: SlashCommand[] = [];
    for (const cat of categoryOrder) {
      sorted.push(...this.baseCommands.filter((c) => c.category === cat));
    }
    return sorted;
  }

  public searchCommands(query: string): SlashCommand[] {
    const rawClean = query.startsWith('/') ? query.slice(1).trim() : query.trim();
    if (!rawClean) {
      return this.getAllCommands();
    }

    const minThreshold = rawClean.length <= 2 ? 35 : rawClean.length <= 3 ? 55 : 75;

    const scoredItems = this.baseCommands.map((cmd) => {
      const prefixWithoutSlash = cmd.prefix.replace(/^\//, '');
      const prefixScore = calculateFuzzyScore(rawClean, prefixWithoutSlash);
      const labelScore = calculateFuzzyScore(rawClean, cmd.label);
      const descScore = calculateFuzzyScore(rawClean, cmd.description);
      const categoryScore = calculateFuzzyScore(rawClean, cmd.category);

      let keywordScore = 0;
      if (cmd.keywords) {
        for (const kw of cmd.keywords) {
          const s = calculateFuzzyScore(rawClean, kw);
          if (s > keywordScore) keywordScore = s;
        }
      }

      const totalScore = Math.max(
        prefixScore * 1.8,
        labelScore * 1.4,
        keywordScore * 1.2,
        categoryScore * 0.7,
        descScore * 0.4
      );

      return { cmd, score: totalScore };
    });

    const matching = scoredItems.filter((item) => item.score >= minThreshold);
    if (matching.length === 0) {
      return [];
    }

    const categories: CommandCategory[] = ['system', 'mcp'];
    const categoryMaxScores: Record<CommandCategory, number> = {
      system: 0,
      mcp: 0,
    };

    for (const item of matching) {
      const cat = item.cmd.category;
      if (item.score > categoryMaxScores[cat]) {
        categoryMaxScores[cat] = item.score;
      }
    }

    const sortedCategories = [...categories].sort(
      (a, b) => categoryMaxScores[b] - categoryMaxScores[a]
    );

    const result: SlashCommand[] = [];
    for (const cat of sortedCategories) {
      const catMatches = matching
        .filter((item) => item.cmd.category === cat)
        .sort((a, b) => b.score - a.score);

      result.push(...catMatches.map((item) => item.cmd));
    }

    return result;
  }

  public registerCommand(command: SlashCommand): void {
    this.baseCommands = this.baseCommands.filter((c) => c.id !== command.id);
    this.baseCommands.push(command);
  }

  public unregisterCommand(id: string): void {
    this.baseCommands = this.baseCommands.filter((c) => c.id !== id);
  }
}

export type NavDirection = 'up' | 'down' | 'left' | 'right';

export function getNextGridIndex(
  commands: SlashCommand[],
  currentIndex: number,
  direction: NavDirection,
  columns: number = 2
): number {
  if (commands.length === 0) return 0;
  if (currentIndex < 0 || currentIndex >= commands.length) return 0;

  const categoryOrder: CommandCategory[] = [];
  for (const cmd of commands) {
    if (!categoryOrder.includes(cmd.category)) {
      categoryOrder.push(cmd.category);
    }
  }

  const grid: Array<Array<number>> = [];
  const itemToPos = new Map<number, { row: number; col: number }>();

  let globalIdx = 0;
  for (const cat of categoryOrder) {
    const group = commands.filter((c) => c.category === cat);
    if (group.length === 0) continue;

    let currentRow: number[] = [];
    for (let i = 0; i < group.length; i++) {
      const idx = globalIdx++;
      currentRow.push(idx);

      if (currentRow.length === columns || i === group.length - 1) {
        const rowNum = grid.length;
        currentRow.forEach((itemIdx, colNum) => {
          itemToPos.set(itemIdx, { row: rowNum, col: colNum });
        });
        grid.push(currentRow);
        currentRow = [];
      }
    }
  }

  if (grid.length === 0) return 0;

  const pos = itemToPos.get(currentIndex) || { row: 0, col: 0 };
  const totalRows = grid.length;
  let targetRow = pos.row;
  let targetCol = pos.col;

  if (direction === 'right') {
    if (pos.col + 1 < grid[pos.row].length) {
      targetCol = pos.col + 1;
    } else {
      targetRow = (pos.row + 1) % totalRows;
      targetCol = 0;
    }
  } else if (direction === 'left') {
    if (pos.col - 1 >= 0) {
      targetCol = pos.col - 1;
    } else {
      targetRow = (pos.row - 1 + totalRows) % totalRows;
      targetCol = grid[targetRow].length - 1;
    }
  } else if (direction === 'down') {
    targetRow = (pos.row + 1) % totalRows;
    targetCol = Math.min(pos.col, grid[targetRow].length - 1);
  } else if (direction === 'up') {
    targetRow = (pos.row - 1 + totalRows) % totalRows;
    targetCol = Math.min(pos.col, grid[targetRow].length - 1);
  }

  const result = grid[targetRow]?.[targetCol];
  return typeof result === 'number' ? result : 0;
}

export const commandRegistry = new CommandRegistry();
