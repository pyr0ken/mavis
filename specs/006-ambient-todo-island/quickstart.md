# Quickstart: Ambient Todo Island & Action Card

**Feature**: `specs/006-ambient-todo-island`  
**Date**: 2026-10-04  

---

## ⚡ Quick User Guide

### 1. Opening the Todo Card
- Press `Ctrl + T` anywhere when Mavis overlay is active.
- Or type `/todo` in the notch and press `Enter`.
- Or click the **Todo & Focus** tile in the Dashboard Hub.

### 2. Creating a Task with Smart Tokens
In the top quick input field:
- `Fix socket leak p1 #oxiroute` ➔ High priority (P1), tag `#oxiroute`
- `Review WooCommerce order webhook p2 #ghatehchian` ➔ Medium priority (P2)
- Press `Enter` to create instantly.

### 3. Keyboard Navigation (Linear / Raycast)
- `j` or `↓`: Select next task
- `k` or `↑`: Select previous task
- `Space`: Mark task as Done / Unmark
- `Enter` or `d`: Start **Now Doing** (Triggers Live Activity timer)
- `1`, `2`, `3`, `0`: Set priority to P1, P2, P3, None
- `Backspace` or `Delete`: Delete selected task
- `Esc`: Close Todo card and return to idle notch

### 4. Ambient Notch "Now Doing" (Live Activity)
When a task is set to **Now Doing**:
- The collapsed notch displays `🎯 <Task Title> [<elapsed>m]`.
- Click the checkmark button `✓` on the right to complete it with a green spring capsule animation.
- Click the title to re-open the `/todo` card.

---

## 🛠️ Developer Verification

```bash
# Verify build & type checks
npm run build

# Start local dev server
npm run dev
```
