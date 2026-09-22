# Interface Contract: System-Level Overlay IPC & Window Control

**Feature Directory**: `specs/003-krunner-system-overlay`  
**Created**: 2026-09-21  
**Status**: Active  
**Target Spec**: [spec.md](../spec.md)

---

## 1. Rust Tauri Native Commands

### 1.1 `center_top_window`
Positions the transparent overlay window at `top: 0, left: 50%` of the primary display and enforces sticky multi-workspace presence and always-on-top attributes.

```rust
#[tauri::command]
pub fn center_top_window(window: WebviewWindow) -> Result<(), String>
```
**Side Effects:**
- Queries `window.primary_monitor()`.
- Sets logical position `x: (monitor_width - 1100.0) / 2.0, y: monitor_pos.y`.
- Invokes `window.set_always_on_top(true)`.
- Invokes `window.set_visible_on_all_workspaces(true)`.

---

### 1.2 `show_window`
Makes the overlay visible, ensures top-center positioning on all workspaces, and grabs focus for immediate user interaction.

```rust
#[tauri::command]
pub fn show_window(window: WebviewWindow) -> Result<(), String>
```
**Side Effects:**
- Calls `center_top_window`.
- Invokes `window.show()`.
- Invokes `window.set_focus()`.
- Invokes `window.set_always_on_top(true)`.

---

### 1.3 `hide_window`
Hides the overlay window and releases focus back to the operating system / previous active window.

```rust
#[tauri::command]
pub fn hide_window(window: WebviewWindow) -> Result<(), String>
```
**Side Effects:**
- Invokes `window.hide()`.

---

### 1.4 `set_cursor_click_through`
Dynamically toggles whether the transparent canvas passes mouse clicks to background windows.

```rust
#[tauri::command]
pub fn set_cursor_click_through(window: WebviewWindow, ignore: bool) -> Result<(), String>
```
**Parameters:**
- `ignore`: `true` to allow clicks to pass through to apps underneath; `false` to capture pointer events inside the Mavis container.

---

## 2. IPC Events

### 2.1 Native to Frontend (`emit`)

| Event Name | Payload | Trigger Condition |
|:---|:---|:---|
| `global-shortcut-triggered` | `null` | User pressed the global system shortcut (`Ctrl + Alt`) from any desktop or app |
| `workspace-changed` | `{ desktopIndex: number }` | OS emitted a virtual desktop switch notification |

---

### 2.2 Frontend to Native (`invoke`)

| Command | Arguments | Expected Response |
|:---|:---|:---|
| `show_window` | `{}` | `Result<(), String>` |
| `hide_window` | `{}` | `Result<(), String>` |
| `center_top_window` | `{}` | `Result<(), String>` |
| `set_cursor_click_through` | `{ ignore: boolean }` | `Result<(), String>` |

---

## 3. KDE Plasma KWin Rule Contract (Declarative Fallback)

For environments requiring explicit KWin rule persistence (`~/.config/kwinrulesrc`):

```ini
[Mavis KRunner Overlay]
Description=Mavis KRunner-Style Sticky Overlay
wmclass=mavis
wmclasscomplete=true
wmclassmatch=1
desktops=all
desktopsrule=3
above=true
aboverule=3
skiptaskbar=true
skiptaskbarrule=3
skippager=true
skippagerrule=3
noborder=true
noborderrule=3
```
