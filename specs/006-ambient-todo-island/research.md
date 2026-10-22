# Research & Technical Decisions: Ambient Todo Island

**Feature**: `specs/006-ambient-todo-island`  
**Date**: 2026-10-04  
**Status**: Completed  

---

## 1. Storage & Reactivity Architecture

### Context
Mavis operates as a high-speed desktop overlay where user interactions must initiate in < 50ms. Storing tasks must have zero I/O latency, synchronous first render, and persistent cross-session durability.

### Options Considered
1. **Async SQLite via Tauri IPC (`invoke('save_todo', ...)`):**
   - *Pros*: Relational queries, ACID.
   - *Cons*: Async initialization means a slight flicker on cold-start; requires Rust backend schema migrations.
2. **Synchronous LocalStorage with Reactive Subscription Pattern (Chosen):**
   - *Pros*: 0ms synchronous hydration upon component mount; identical to `sessionStorageService.ts` in Mavis; reactive subscriber pattern allows decoupled multi-component updates (Notch Idle Bar + Action Card + Dashboard Hub).
   - *Cons*: Data limited to ~5MB (more than sufficient for thousands of developer tasks).

### Decision
Use `localStorage` with an in-memory cache and pub/sub event emitter (`todoStorageService.ts`). Whenever any mutation occurs (add, toggle, prioritize, delete, setDoing), all subscribers are notified immediately.

---

## 2. Natural Language Input Parser

### Context
Developers need to capture tasks rapidly without clicking dropdowns or picking priority modals. Typing `Fix socket leak in oxiroute p1 #rust #network` should immediately configure the task.

### Token Specification
- **Priority**:
  - `p1`, `P1`, `!1`, `urgent` -> `p1` (High / Neon Red)
  - `p2`, `P2`, `!2`, `medium` -> `p2` (Medium / Amber)
  - `p3`, `P3`, `!3`, `low` -> `p3` (Low / Sky Blue)
  - Default: `none`
- **Tags**:
  - `#([a-zA-Z0-9_\-]+)` extracted into `tags: string[]`.
- **Title**:
  - The remaining string with tokens stripped and trimmed.

### Regex Implementation
```typescript
const tagRegex = /#([a-zA-Z0-9_\-]+)/g;
const priorityRegex = /\b(p[1-3]|![1-3]|urgent|medium|low)\b/i;
```

---

## 3. Ambient Live Activity in Collapsed Notch

### Context
When a task is in `in_progress` (Now Doing), the idle notch (`400px x 54px`) should transform into an ambient focus display rather than a generic prompt bar.

### UX Architecture in Idle Mode
- **Left**: Live glowing pulsating indicator (Amber/Emerald target badge) showing active state.
- **Center**: Current task title with a live ticking elapsed badge (e.g., `🎯 Refactor Gateway [18m]`). Clicking this opens the full `/todo` Action Card.
- **Right**: Compact Quick-Complete Checkmark button. Clicking it instantly completes the task, triggers Mavis's physical spring success capsule (`Conversation closed / Task finished`), and collapses smoothly.

---

## 4. Keyboard Navigation Protocol (Linear / Raycast Style)

### Key Bindings
| Key | Context | Action |
|-----|---------|--------|
| `Ctrl + T` | Anywhere in Mavis | Toggle `/todo` Action Card |
| `j` / `Down` | Inside Todo Card (when input not focused) | Move focus to next task |
| `k` / `Up` | Inside Todo Card (when input not focused) | Move focus to previous task |
| `Space` | On focused task | Toggle between Todo & Done |
| `Enter` or `d` | On focused task | Set as Active Now Doing (starts timer & Notch Live Activity) |
| `1` / `2` / `3` / `0` | On focused task | Change priority to P1 / P2 / P3 / None |
| `Backspace` / `d` / `Delete` | On focused task | Delete task |
| `Escape` | Inside Todo Card | Close Todo Card and return to idle notch |
| `/` or `i` | Inside Todo Card | Focus quick input field |

---

## 5. Performance & Resource Footprint

- Timer refresh is executed via a single `setInterval` (1000ms) only when a task is `in_progress`.
- No unneeded re-renders: `useMemo` and selective subscriptions ensure zero CPU spikes when idle.
- Meets Mavis Constitution Principle II (< 35MB RAM, < 0.1% CPU idle).
