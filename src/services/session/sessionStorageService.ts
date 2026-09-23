import { SessionRecord, SessionStorageState } from '../../types/commands';
import { ChatMessage } from '../../types/island';

const STORAGE_KEY = 'mavis_voice_island_sessions_v1';
const ACTIVE_SESSION_KEY = 'mavis_voice_island_active_session_id';

class SessionStorageService {
  private memoryState: SessionStorageState = {
    activeSessionId: '',
    sessions: [],
  };

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);

        if (stored) {
          const parsed = JSON.parse(stored) as SessionRecord[];
          this.memoryState.sessions = Array.isArray(parsed) ? parsed : [];
        }

        if (storedActiveId && this.memoryState.sessions.some((s) => s.id === storedActiveId)) {
          this.memoryState.activeSessionId = storedActiveId;
        } else if (this.memoryState.sessions.length > 0) {
          this.memoryState.activeSessionId = this.memoryState.sessions[0].id;
        } else {
          const initial = this.createNewSession('Initial Session');
          this.memoryState.activeSessionId = initial.id;
        }
      }
    } catch (e) {
      console.warn('[SessionStorageService] Failed to load local sessions:', e);
      if (this.memoryState.sessions.length === 0) {
        const fallback = this.createNewSession('Initial Session');
        this.memoryState.activeSessionId = fallback.id;
      }
    }
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryState.sessions));
        localStorage.setItem(ACTIVE_SESSION_KEY, this.memoryState.activeSessionId);
      }
    } catch (e) {
      console.warn('[SessionStorageService] Failed to persist sessions:', e);
    }
  }

  public getAllSessions(): SessionRecord[] {
    return [...this.memoryState.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getSession(id: string): SessionRecord | null {
    return this.memoryState.sessions.find((s) => s.id === id) || null;
  }

  public getActiveSession(): SessionRecord | null {
    return this.getSession(this.memoryState.activeSessionId);
  }

  public getActiveSessionId(): string {
    return this.memoryState.activeSessionId;
  }

  public setActiveSessionId(id: string): void {
    if (this.memoryState.sessions.some((s) => s.id === id)) {
      this.memoryState.activeSessionId = id;
      this.persist();
    }
  }

  public createNewSession(initialTitle = 'New Conversation'): SessionRecord {
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const newSession: SessionRecord = {
      id,
      title: initialTitle,
      createdAt: now,
      updatedAt: now,
      messages: [],
      tokenCount: 0,
      model: 'antigravity',
    };

    this.memoryState.sessions.unshift(newSession);
    this.memoryState.activeSessionId = id;
    this.persist();
    return newSession;
  }

  public saveSessionMessages(sessionId: string, messages: ChatMessage[], customTitle?: string): void {
    const idx = this.memoryState.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;

    const existing = this.memoryState.sessions[idx];
    const now = Date.now();

    // Generate intelligent title from the first user message if not already customized
    let title = customTitle || existing.title;
    if ((!existing.title || existing.title === 'New Conversation' || existing.title === 'Initial Session') && !customTitle) {
      const firstUserMsg = messages.find((m) => m.role === 'user' && m.content.trim().length > 0);
      if (firstUserMsg) {
        const text = firstUserMsg.content.trim();
        title = text.length > 38 ? `${text.slice(0, 35)}...` : text;
      }
    }

    this.memoryState.sessions[idx] = {
      ...existing,
      title,
      messages,
      updatedAt: now,
    };

    this.persist();
  }

  public deleteSession(id: string): void {
    this.memoryState.sessions = this.memoryState.sessions.filter((s) => s.id !== id);

    if (this.memoryState.activeSessionId === id) {
      if (this.memoryState.sessions.length > 0) {
        this.memoryState.activeSessionId = this.memoryState.sessions[0].id;
      } else {
        const fresh = this.createNewSession('New Conversation');
        this.memoryState.activeSessionId = fresh.id;
      }
    }

    this.persist();
  }

  public clearAllSessions(): void {
    this.memoryState.sessions = [];
    const fresh = this.createNewSession('New Conversation');
    this.memoryState.activeSessionId = fresh.id;
    this.persist();
  }
}

export const sessionStorageService = new SessionStorageService();
