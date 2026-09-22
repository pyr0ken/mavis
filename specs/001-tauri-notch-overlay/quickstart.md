# Quickstart & Validation Guide: Floating Notch Overlay

**Feature Branch**: `001-tauri-notch-overlay`  
**Status**: Ready for Implementation

---

## 1. Prerequisites & Environment Setup

- **Operating System**: Linux (Arch / Wayland / X11), macOS, or Windows 11.
- **Node.js**: >= 20.x (`node -v`)
- **Rust & Cargo**: >= 1.75 (`rustc --version`, `cargo --version`)
- **System Libraries (Linux/Arch)**:
  ```bash
  sudo pacman -S --needed webkit2gtk-4.1 base-devel openssl
  ```

---

## 2. Installation & Running in Development

### 1. Web Preview & Rapid UI Iteration
Run the standalone web preview with instant hot-reloading:
```bash
cd mavis
npm install
npm run dev
```

### 2. Native Tauri 2.0 Floating Overlay
Run the full desktop floating transparent window with global shortcut listeners:
```bash
npm run tauri dev
```

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Global Shortcut Toggle
1. Open any background app (Terminal, Browser, VS Code / Zed).
2. Press `Ctrl + Alt + Enter`.
3. **Verify**: The notch at the top center of the primary screen immediately drops down and expands with a fluid spring animation in under 50ms.
4. Press `Ctrl + Alt + Enter` again.
5. **Verify**: The island smoothly retracts back into the top bezel.

### Scenario 2: Escape Key & Outside Click Dismissal
1. Press `Ctrl + Alt + Enter` to open the island.
2. Click anywhere on your desktop wallpaper or background application.
3. **Verify**: The island automatically retracts and closes.
4. Open the island again, then press `Escape`.
5. **Verify**: The island retracts instantly without UI glitch.

### Scenario 3: Memory & Performance Audit
1. Keep the application running in background idle mode.
2. In terminal, run:
   ```bash
   ps aux | grep mavis | awk '{print $6/1024 " MB"}'
   ```
3. **Verify**: Total memory footprint is strictly **< 35MB RAM**.
4. Trigger 20 rapid open/close animations.
5. **Verify**: Animations maintain solid **60+ FPS** without frame drops or jitter.
