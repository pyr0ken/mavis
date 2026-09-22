<!--
Sync Impact Report:
- Version change: none -> 1.0.0 (Initial Ratification)
- Ratified: 2026-09-20
- Principles Defined:
  1. I. Fluid Spring Physics & Notch-Anchored Morphing (NON-NEGOTIABLE)
  2. II. Ultra-Lightweight Floating Desktop Architecture via Tauri 2.0 (NON-NEGOTIABLE)
  3. III. Privacy-First & Zero-Unprompted Audio Capture (NON-NEGOTIABLE)
  4. IV. Voice-to-Action Structured Intent Execution (NON-NEGOTIABLE)
  5. V. Architectural Layering & Decoupled Audio/UI Pipeline
  6. VI. Dark Elegance & Linear/Raycast Design Aesthetics
- Added sections:
  - Technology Stack & Operational Constraints
  - Development Workflow & Quality Gates
  - Governance
- Deferred items:
  - Feature specification for Mavis Core Engine & Tauri 2.0 scaffold (`/speckit-specify`)
  - Integration of Streaming STT (Speech-to-Text) Audio Pipeline
  - Implementation of Structured Action Cards (Gmail, Calendar, Screen Context)
-->

# Mavis Constitution

## Core Principles

### I. Fluid Spring Physics & Notch-Anchored Morphing (NON-NEGOTIABLE)
The application interface MUST anchor directly to the laptop top bezel/notch coordinate space (`top: 0, left: 50%`) with concave shoulder fillets for seamless hardware integration. All transitions between states (Idle Notch, Active Listening, Action Card Execution, Success Toast, and Hidden) MUST utilize physically modeled spring dynamics (elastic overshoot, smooth deceleration, zero linear or rigid jumps). The visual response to any hotkey or voice trigger MUST initiate in under 50ms.

### II. Ultra-Lightweight Floating Desktop Architecture via Tauri 2.0 (NON-NEGOTIABLE)
The desktop application MUST be engineered using **Tauri 2.0** with a high-performance Rust core. 
- Idle memory footprint MUST remain strictly under **35MB RAM**.
- Idle CPU usage MUST remain **< 0.1%**.
- The floating window MUST be frameless and transparent (`transparent: true`, `decorations: false`, `alwaysOnTop: true`).
- The overlay MUST implement dynamic mouse click-through (`set_ignore_cursor_events(true)` when collapsed) so that background desktop apps remain fully clickable.
- Activation MUST be bound to a global operating system shortcut (e.g. `Option + Space` / `Super + Space`).

### III. Privacy-First & Zero-Unprompted Audio Capture (NON-NEGOTIABLE)
The microphone stream MUST only be opened during an explicit, user-initiated session (Push-to-Talk or toggle activation). 
- A prominent visual indicator (ambient glowing aura and hardware status dot) MUST be active whenever audio input is being captured.
- Raw audio streams MUST NEVER be stored permanently on disk or transmitted unencrypted.
- All voice data and transcription pipelines MUST follow strict privacy safeguards.

### IV. Voice-to-Action Structured Intent Execution (NON-NEGOTIABLE)
The system MUST transcend basic speech-to-text dictation by transforming voice commands into structured, executable actions (Structured Tool Calling & Function Calling). 
- Every voice intent (e.g., composing emails, creating calendar invites, searching files, extracting on-screen context) MUST morph the UI from a simple listening bar into a tailored, interactive Action Card.
- Destructive or external actions MUST provide visual confirmation and allow user override before execution.
- Successful executions MUST morph cleanly into a compact HUD Success Toast before retracting into the notch.

### V. Architectural Layering & Decoupled Audio/UI Pipeline
Strict separation of concerns MUST be enforced across five distinct layers:
1. `src/components/`: Presentation layer (React, Tailwind CSS, GSAP / Framer Motion, SVG notch fillets, and Action Cards).
2. `src/audio/`: Web Audio API & FFT frequency visualizer (real-time waveform bars).
3. `src/services/stt/`: Low-latency speech-to-text streaming provider (Whisper / Deepgram / Local CTranslate2).
4. `src/services/agent/`: Intent routing, prompt templates, and structured JSON tool schemas.
5. `src-tauri/`: Rust native layer (window management, transparent overlay, global shortcuts, and OS IPC bridge).

Data and control events MUST flow unidirectionally from the native trigger / audio engine into the state machine and down to the UI components.

### VI. Dark Elegance & Linear/Raycast Design Aesthetics
The visual identity MUST adhere to ultra-high-end dark mode aesthetics (Linear and Raycast inspired):
- Deep obsidian / matte black containers (`#0b0f19` / `#000000`).
- Frosted glass vibrancy with hardware-accelerated `backdrop-filter: blur(32px) saturate(180%)`.
- Crisp typography (Inter / Geist / Plus Jakarta Sans) and razor-thin border glows (`1px solid rgba(255, 255, 255, 0.12)`).
- Fluid audio waveforms and multicolor glowing edge auras during active voice listening.

---

## Technology Stack & Operational Constraints

- **Desktop Framework:** Tauri 2.0 (Rust backend + Web frontend).
- **Frontend Stack:** React 19 / TypeScript, Tailwind CSS, GSAP / Framer Motion, Lucide Icons.
- **Audio Processing:** Web Audio API (AnalyserNode for real-time FFT visualization) + Rust CPAL (optional native audio capture).
- **Voice / AI Engine:** Low-latency Streaming STT + Structured Output LLM Orchestrator.
- **Operating System Targets:** macOS (Notch & Dynamic Island native feel), Linux (Wayland/X11 floating overlay), Windows 11.
- **Performance Budgets:**
  - Startup / Hotkey activation to visual render: **< 50ms**.
  - Memory Footprint (Idle): **< 35MB RAM**.
  - Frame Rate during animation morphs: **Solid 60 / 120 FPS**.

---

## Development Workflow & Quality Gates

- **Physics Fidelity:** All morphing animations must be verified with smooth spring curves; no jerky resizing or jarring layout shifts.
- **Zero Memory Leaks:** Web Audio contexts, event listeners, and animation timers MUST be properly torn down when the island collapses.
- **Clean Tool Calling:** All agent actions must parse into typed schemas with fallback handling.

---

## Governance

- This Constitution is the binding architectural and quality contract for the `mavis` project.
- Any modification to core principles, architectural boundaries, or performance budgets requires an explicit version bump and human ratification.
- Feature planning and implementation MUST strictly follow the Spec Kit workflow (`/speckit-specify` -> `/speckit-plan` -> `/speckit-tasks` -> `/speckit-implement`).

**Version**: 1.0.0 | **Ratified**: 2026-09-20 | **Last Amended**: 2026-09-20
