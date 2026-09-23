# Contract: Slash Command Registry & Execution Protocol

**Feature**: `specs/005-slash-command-palette`  
**Date**: 2026-09-23  

---

## 1. Slash Command Registry Contract

```typescript
export interface ICommandRegistry {
  /**
   * Returns all registered slash commands.
   */
  getAllCommands(): SlashCommand[];

  /**
   * Filters commands matching the user's query string using fuzzy ranking.
   * @param query - Search term excluding the leading slash (e.g. "his" for "/history")
   */
  searchCommands(query: string): SlashCommand[];

  /**
   * Registers a new dynamic command or skill trigger into the registry.
   */
  registerCommand(command: SlashCommand): void;

  /**
   * Unregisters a command by ID.
   */
  unregisterCommand(id: string): void;
}
```

---

## 2. Session Storage Manager Contract

```typescript
export interface ISessionStorageService {
  /**
   * Retrieves all stored conversation sessions ordered by updatedAt DESC.
   */
  getAllSessions(): SessionRecord[];

  /**
   * Retrieves a specific session by its unique ID.
   */
  getSession(id: string): SessionRecord | null;

  /**
   * Creates and persists a new empty conversation session.
   */
  createNewSession(initialTitle?: string): SessionRecord;

  /**
   * Updates an existing session with new messages and title updates.
   */
  saveSession(session: SessionRecord): void;

  /**
   * Deletes a session by ID.
   */
  deleteSession(id: string): void;

  /**
   * Returns the ID of the currently active session.
   */
  getActiveSessionId(): string;

  /**
   * Sets the active session ID.
   */
  setActiveSessionId(id: string): void;
}
```
