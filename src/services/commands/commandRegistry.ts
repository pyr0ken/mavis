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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
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

  // 2. Starts with query (Prefix)
  if (t.startsWith(q)) {
    return 600 + Math.max(0, 50 - t.length);
  }

  // 3. Substring match
  const subIdx = t.indexOf(q);
  if (subIdx !== -1) {
    return 400 - subIdx * 5;
  }

  // 4. Fuzzy Subsequence Match (e.g. "nw" in "new", "cr" in "code review")
  let qIdx = 0;
  let score = 0;
  let consecutive = 0;
  let prevMatchIdx = -2;

  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++;
      let charScore = 25;

      // Word-boundary bonus (start of word or after delimiter / - _ :)
      if (tIdx === 0 || /[\s\-_:/]/.test(t[tIdx - 1])) {
        charScore += 45;
      }

      // Consecutive match bonus
      if (tIdx === prevMatchIdx + 1) {
        consecutive++;
        charScore += consecutive * 20;
      } else {
        consecutive = 0;
      }

      prevMatchIdx = tIdx;
      score += charScore;
    }
  }

  // If all query characters appeared in sequence
  if (qIdx === q.length) {
    return score + 120;
  }

  // 5. Typo tolerance via Levenshtein distance for close edits (e.g. "mdoel" -> "model")
  if (q.length >= 2) {
    const dist = levenshteinDistance(q, t);
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - dist / maxLen;
    if (dist <= 2 && similarity >= 0.45) {
      return Math.round(similarity * 150);
    }
  }

  return 0;
}

export class CommandRegistry {
  private commands: SlashCommand[] = [];

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
        description: 'Start a fresh conversation and archive current thread',
        category: 'system',
        icon: 'Plus',
        shortcut: 'Ctrl+N',
        keywords: ['new', 'nw', 'reset', 'fresh', 'create', 'start', 'clear'],
        execute: (ctx) => {
          ctx.startNewSession();
          ctx.showNotification('New session initialized', 'success');
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
        label: 'Clear Canvas',
        description: 'Clear messages on active screen without deleting session',
        category: 'system',
        icon: 'Trash2',
        shortcut: 'Ctrl+L',
        keywords: ['clear', 'clean', 'wipe', 'empty', 'screen'],
        execute: (ctx) => {
          ctx.clearMessages();
          ctx.showNotification('Canvas cleared', 'info');
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

      // 2. Models
      {
        id: 'cmd-model-claude',
        prefix: '/model:claude',
        label: 'Claude 3.7 Sonnet',
        description: 'Anthropic reasoning & hybrid thinking agent engine',
        category: 'model',
        icon: 'Sparkles',
        keywords: ['claude', 'anthropic', 'sonnet', 'reasoning', 'model'],
        execute: (ctx) => {
          ctx.switchModel('claude-3-7-sonnet', 'Claude 3.7 Sonnet');
          ctx.showNotification('Switched model to Claude 3.7 Sonnet', 'success');
        },
      },
      {
        id: 'cmd-model-gpt4o',
        prefix: '/model:gpt4o',
        label: 'GPT-4o Omnimodal',
        description: 'OpenAI high-speed multimodal vision and agent core',
        category: 'model',
        icon: 'Zap',
        keywords: ['gpt4', 'gpt4o', 'openai', 'chatgpt', 'model'],
        execute: (ctx) => {
          ctx.switchModel('gpt-4o', 'GPT-4o');
          ctx.showNotification('Switched model to GPT-4o', 'success');
        },
      },
      {
        id: 'cmd-model-gemini',
        prefix: '/model:gemini',
        label: 'Gemini 2.5 Flash',
        description: 'Google 1M+ context window with ultra-low latency',
        category: 'model',
        icon: 'Compass',
        keywords: ['gemini', 'google', 'flash', 'long-context', 'model'],
        execute: (ctx) => {
          ctx.switchModel('gemini-2.5-flash', 'Gemini 2.5 Flash');
          ctx.showNotification('Switched model to Gemini 2.5 Flash', 'success');
        },
      },
      {
        id: 'cmd-model-local',
        prefix: '/model:local',
        label: 'Local Offline Core',
        description: 'Ollama / CTranslate2 private zero-cloud execution',
        category: 'model',
        icon: 'HardDrive',
        keywords: ['local', 'ollama', 'offline', 'privacy', 'llama', 'model'],
        execute: (ctx) => {
          ctx.switchModel('local-ollama', 'Local Offline');
          ctx.showNotification('Switched model to Local Offline', 'info');
        },
      },

      // 3. Skills
      {
        id: 'cmd-skill-review',
        prefix: '/skill:review',
        label: 'Code Review Playbook',
        description: 'Inspect diffs, security gates, and architecture patterns',
        category: 'skill',
        icon: 'Code',
        keywords: ['review', 'code', 'cr', 'security', 'quality', 'audit', 'skill'],
        execute: (ctx) => {
          ctx.injectPrompt('Please conduct a thorough code review focusing on correctness, edge cases, and performance.');
        },
      },
      {
        id: 'cmd-skill-plan',
        prefix: '/skill:plan',
        label: 'Spec & Implementation Plan',
        description: 'Generate comprehensive technical specification and tasks',
        category: 'skill',
        icon: 'FileText',
        keywords: ['plan', 'architecture', 'spec', 'design', 'roadmap', 'skill'],
        execute: (ctx) => {
          ctx.injectPrompt('Create a detailed engineering plan with user stories, acceptance criteria, and checklist tasks for: ');
        },
      },
      {
        id: 'cmd-skill-debug',
        prefix: '/skill:debug',
        label: 'Systematic Debugging',
        description: 'Execute 4-phase root cause analysis and verification loop',
        category: 'skill',
        icon: 'Bug',
        keywords: ['debug', 'bug', 'fix', 'error', 'investigate', 'skill'],
        execute: (ctx) => {
          ctx.injectPrompt('Apply systematic root cause debugging to diagnose and fix this issue: ');
        },
      },
      {
        id: 'cmd-skill-tdd',
        prefix: '/skill:tdd',
        label: 'Test-Driven Development',
        description: 'RED-GREEN-REFACTOR test generation and validation',
        category: 'skill',
        icon: 'CheckCircle2',
        keywords: ['tdd', 'test', 'jest', 'unit', 'integration', 'skill'],
        execute: (ctx) => {
          ctx.injectPrompt('Write comprehensive unit tests following strict TDD methodology for: ');
        },
      },

      // 4. Integrations & MCP
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

    this.commands = defaults;
  }

  public getAllCommands(): SlashCommand[] {
    const categoryOrder: CommandCategory[] = ['system', 'model', 'skill', 'mcp'];
    const sorted: SlashCommand[] = [];
    for (const cat of categoryOrder) {
      sorted.push(...this.commands.filter((c) => c.category === cat));
    }
    return sorted;
  }

  public searchCommands(query: string): SlashCommand[] {
    const cleanQuery = query.startsWith('/') ? query.slice(1).trim() : query.trim();

    if (!cleanQuery) {
      return this.getAllCommands();
    }

    const scoredItems = this.commands.map((cmd) => {
      const prefixWithoutSlash = cmd.prefix.replace(/^\//, '');
      const prefixScore = calculateFuzzyScore(cleanQuery, prefixWithoutSlash);
      const labelScore = calculateFuzzyScore(cleanQuery, cmd.label);
      const descScore = calculateFuzzyScore(cleanQuery, cmd.description);
      const categoryScore = calculateFuzzyScore(cleanQuery, cmd.category);

      let keywordScore = 0;
      if (cmd.keywords) {
        for (const kw of cmd.keywords) {
          const s = calculateFuzzyScore(cleanQuery, kw);
          if (s > keywordScore) keywordScore = s;
        }
      }

      // Compute total weighted maximum score
      const maxScore = Math.max(
        prefixScore * 1.5,
        labelScore * 1.2,
        keywordScore * 1.3,
        categoryScore * 0.8,
        descScore * 0.5
      );

      return { cmd, score: maxScore };
    });

    const matching = scoredItems.filter((item) => item.score > 15);

    // Group matching items by category in standard order while sorting within each category by score
    const categoryOrder: CommandCategory[] = ['system', 'model', 'skill', 'mcp'];
    const result: SlashCommand[] = [];

    // If there is an overwhelmingly strong top match (e.g. exact or prefix match), ensure it leads
    matching.sort((a, b) => b.score - a.score);

    for (const cat of categoryOrder) {
      const catMatches = matching.filter((item) => item.cmd.category === cat);
      result.push(...catMatches.map((item) => item.cmd));
    }

    return result;
  }

  public registerCommand(command: SlashCommand): void {
    this.commands = this.commands.filter((c) => c.id !== command.id);
    this.commands.push(command);
  }

  public unregisterCommand(id: string): void {
    this.commands = this.commands.filter((c) => c.id !== id);
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

  // Build 2D coordinates for all commands grouped by category
  const categories: CommandCategory[] = ['system', 'model', 'skill', 'mcp'];
  const grid: Array<Array<number>> = [];
  const itemToPos = new Map<number, { row: number; col: number }>();

  let globalIdx = 0;
  for (const cat of categories) {
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
      // Move to next row col 0
      targetRow = (pos.row + 1) % totalRows;
      targetCol = 0;
    }
  } else if (direction === 'left') {
    if (pos.col - 1 >= 0) {
      targetCol = pos.col - 1;
    } else {
      // Move to previous row last col
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
