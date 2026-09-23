import { ChatMessage } from './island';

export type CommandCategory = 'system' | 'model' | 'skill' | 'mcp';

export interface CommandExecutionContext {
  // Session Controls
  startNewSession: () => void;
  openHistory: () => void;
  clearMessages: () => void;
  compactContext: () => void;
  switchModel: (modelId: string, modelName: string) => void;

  // Agent & Prompt Injection
  injectPrompt: (prompt: string, autoSubmit?: boolean) => void;
  setSystemPromptOverride: (prompt: string | null) => void;

  // UI & Overlay Controls
  closePalette: () => void;
  showNotification: (text: string, type?: 'info' | 'success' | 'warning') => void;
}

export interface SlashCommand {
  id: string;
  prefix: string;          // e.g. "/new", "/history", "/skill:review"
  label: string;           // e.g. "New Session", "Code Review Skill"
  description: string;     // e.g. "Clear active context and start fresh conversation"
  category: CommandCategory;
  icon: string;            // Lucide icon identifier (e.g. "Plus", "History", "Sparkles", "Cpu", "Trash2", "Sliders", "Wrench")
  shortcut?: string;       // Optional keyboard shortcut badge (e.g. "Ctrl+N")
  keywords?: string[];     // Extra terms for fuzzy matching
  execute: (context: CommandExecutionContext) => void | Promise<void>;
}

export interface SessionRecord {
  id: string;
  title: string;
  createdAt: number;       // Unix timestamp in ms
  updatedAt: number;       // Unix timestamp in ms
  messages: ChatMessage[];
  tokenCount?: number;
  model?: string;
}

export interface SessionStorageState {
  activeSessionId: string;
  sessions: SessionRecord[];
}
