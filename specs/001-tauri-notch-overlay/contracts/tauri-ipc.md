# Tauri IPC & Event Contracts: Floating Notch Overlay

**Feature Branch**: `001-tauri-notch-overlay`  
**Status**: Completed

---

## 1. Tauri Native Commands (Frontend ➔ Rust)

### `set_ignore_cursor_events`
Controls whether the OS window intercepts mouse clicks or lets them pass through to underlying desktop windows.

- **Command Name**: `set_ignore_cursor_events`
- **Input Parameters**:
  ```json
  {
    "ignore": true
  }
  ```
- **Return Type**: `Result<(), String>`
- **Rust Implementation**:
  ```rust
  #[tauri::command]
  pub fn set_ignore_cursor_events(window: tauri::WebviewWindow, ignore: bool) -> Result<(), String> {
      window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())
  }
  ```

---

### `center_top_window`
Positions the overlay window at the exact top-center of the primary monitor.

- **Command Name**: `center_top_window`
- **Input Parameters**: None
- **Return Type**: `Result<WindowCoordinates, String>`
- **Output Schema**:
  ```json
  {
    "x": 660,
    "y": 0,
    "width": 600,
    "height": 260
  }
  ```

---

## 2. Tauri Event Streams (Rust ➔ Frontend)

### `global-shortcut-triggered`
Emitted by the Rust backend whenever the global system shortcut (`Ctrl + Alt + Enter`) is detected.

- **Event Name**: `global-shortcut-triggered`
- **Payload Schema**:
  ```json
  {
    "shortcut": "Ctrl+Alt+Enter",
    "timestamp": 1758367800000
  }
  ```
- **Frontend Handler**:
  ```typescript
  import { listen } from '@tauri-apps/api/event';

  listen('global-shortcut-triggered', () => {
    toggleIslandState();
  });
  ```

---

## 3. Window Configuration Contract (`tauri.conf.json`)

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Voice Island",
        "width": 600,
        "height": 260,
        "x": null,
        "y": 0,
        "center": false,
        "transparent": true,
        "decorations": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "shadow": false,
        "resizable": false,
        "fullscreen": false,
        "focus": false
      }
    ]
  },
  "plugins": {
    "global-shortcut": {
      "shortcuts": [
        {
          "shortcut": "Ctrl+Alt+Enter",
          "action": "toggle"
        }
      ]
    }
  }
}
```
