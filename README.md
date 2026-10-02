# 🦇 Mavis (Voice Assistant Desktop Overlay)

A floating, notch-integrated AI Voice Assistant UI inspired by **VoiceOS** & **macOS Dynamic Island**.

> **Mavis** (*Songbird* / *M.A.V.I.S: Morphing Audio-Voice & Intent Surface*) is an ambient, lightweight desktop overlay anchored directly to the top screen bezel.

## 🚀 Features
- **Fluid Notch Spring Physics**: Morphing animations seamlessly anchored to the laptop top bezel.
- **Concave Shoulder Curves**: SVG-based inverse filleting for hardware bezel integration.
- **Dynamic Waveform Visualizer**: Real-time microphone audio reactive bars.
- **Voice-to-Action Morphing**: Smooth transitions from Listening ➔ Structured Action (Gmail, Calendar, Dictation) ➔ HUD Toast ➔ Notch Tuck.
- **Lightweight System Overlay**: Built on Tauri 2.0 with Wayland Layer Shell / KWin sticky rules and click-through regions (< 35MB RAM).

---

## 📐 Architecture & State Machine

```
┌─────────────────┐       Trigger (Space/Mic)       ┌────────────────────────┐
│   0. Notch Idle │ ──────────────────────────────► │  1. Voice Listening    │
│  (170 x 28 px)  │                                 │    (420 x 98 px)       │
└─────────────────┘                                 └────────────────────────┘
         ▲                                                       │
         │ (Slide Up Tuck)                                       │ (LLM Intent Extracted)
         │                                                       ▼
┌─────────────────┐       After 2.0s Delay          ┌────────────────────────┐
│  3. HUD Toast   │ ◄────────────────────────────── │  2. Action Execution   │
│  (165 x 38 px)  │                                 │    (460 x 195 px)      │
└─────────────────┘                                 └────────────────────────┘
```

---

## 🛠️ Quick Start

### 1. React + Vite Development
```bash
npm install
npm run dev
```

### 2. Tauri 2.0 Desktop Overlay
```bash
npm run tauri dev
# or via Just
just dev
```

### 3. Persistent Development Service (Background Daemon + Live HMR)
To keep Mavis always running in development mode as a user service (with auto-restart, Vite HMR, and Tauri Rust hot watcher):
```bash
# Start background service
just service-start

# Check service status
just service-status

# Stream live build/HMR logs
just service-logs

# Restart or stop
just service-restart
just service-stop

# Enable auto-start on login
just service-enable
```

---

## 🖥️ Desktop System Integration (KDE Plasma & Wayland)
To ensure Mavis behaves as an omnipresent sticky overlay across all virtual desktops:
```bash
./scripts/kwin-rules/apply-kwin-rule.sh
```
