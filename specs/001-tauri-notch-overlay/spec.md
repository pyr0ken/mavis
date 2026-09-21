# Feature Specification: Floating Notch Overlay with Global Shortcut (Tauri 2.0)

**Feature Branch**: `001-tauri-notch-overlay`

**Created**: 2026-09-20

**Status**: Ready for Planning

**Input**: User description: "شروع پروژه با ساخت یک نسخه اولیه سبک در Tauri 2.0 که با فشردن کلید میانبر سراسری Ctrl + Alt + Enter، یک المان ناچ شناور در بالای صفحه با انیمیشن فنری فوقالعاده نرم باز شود و با فشردن مجدد همان کلید یا کلید Escape به آرامی جمع شده و بسته شود."

## Clarifications

### Session 2026-09-20
- Q: How should the overlay handle mouse clicks outside the expanded island area while it is open? → A: Option A - Auto-dismiss on blur/outside click (Clicking anywhere outside the expanded island automatically retracts it into the notch).
- Q: On multi-monitor setups, on which display should the floating notch overlay appear when invoked? → A: Option A - Primary display top-center (Always anchors to the primary monitor's top bezel for consistent hardware notch alignment).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Shortcut Activation & Dismissal (Priority: P1)

As a desktop user working across various applications, I want to press a global system shortcut (`Ctrl + Alt + Enter`) from anywhere so that the floating voice assistant notch instantly and smoothly drops down from the top edge of my primary screen without stealing exclusive focus or disrupting my workflow.

**Why this priority**: Instant, system-wide activation is the foundational interaction pattern of Voice Island; without global hotkey handling, the overlay cannot serve as an ambient desktop assistant.

**Independent Test**: Can be tested independently by running other desktop applications (browser, terminal, editor) and pressing `Ctrl + Alt + Enter`, verifying that the overlay triggers and toggles state reliably regardless of which window is active.

**Acceptance Scenarios**:

1. **Given** the overlay is in closed/idle state, **When** the user presses `Ctrl + Alt + Enter`, **Then** the notch window immediately expands downward on the primary display with fluid spring physics.
2. **Given** the overlay is open, **When** the user presses `Ctrl + Alt + Enter` again, **Then** the island smoothly retracts back into the top bezel.
3. **Given** the overlay is open, **When** the user presses the `Escape` key, **Then** the overlay closes and retracts cleanly.
4. **Given** the overlay is open, **When** the user clicks anywhere outside the island container (window blur / backdrop click), **Then** the overlay automatically retracts back into the notch.

---

### User Story 2 - Fluid Spring Morphing Animation (Priority: P1)

As a user interacting with the notch, I want the expansion and retraction to follow physically modeled spring dynamics (elastic overshoot, smooth deceleration, and seamless concave corner fillets) so that the interface feels natural, organic, and premium (matching Apple Dynamic Island / VoiceOS quality).

**Why this priority**: The core delight and visual identity of Voice Island depends entirely on fluid, stutter-free spring motion and hardware-notch alignment.

**Independent Test**: Can be tested by triggering repeated open/close cycles at varying frame rates (60Hz / 120Hz) and asserting that no layout shifts, hard jumps, or render hitches occur.

**Acceptance Scenarios**:

1. **Given** an open command, **When** the container expands from 170x28px to 440x110px, **Then** the transition renders at solid 60+ FPS with an elastic overshoot curve and hardware-accelerated transforms.
2. **Given** concave shoulder curves on the top-left and top-right edges, **When** the notch opens or closes, **Then** the shoulders maintain continuous tangential curvature against the screen top border.
3. **Given** an active open state, **When** content finishes expanding, **Then** an ambient glowing ring/border pulses subtly along the outer contour.

---

### User Story 3 - Transparent Window & Non-Intrusive Click Handling (Priority: P1)

As a user operating on my desktop, I want the overlay window to be transparent and click-through when closed, so that I can click and interact with background windows without any invisible window frames blocking my cursor.

**Why this priority**: An always-on-top desktop overlay must never intercept user clicks meant for background applications when it is closed.

**Independent Test**: Can be tested by placing a clickable button or text link directly behind the notch area and verifying that clicks pass through to the background application when closed, but are captured by the island when expanded.

**Acceptance Scenarios**:

1. **Given** the overlay is closed/idle, **When** the user clicks on screen areas outside the tiny notch, **Then** the clicks pass directly through to the underlying operating system window.
2. **Given** the overlay is expanded, **When** the user interacts with elements inside the island (buttons, mic toggle), **Then** click events are captured and executed normally.
3. **Given** the overlay is expanded, **When** the user clicks outside the island bounds, **Then** the overlay intercepts the blur/dismiss event, triggers the retraction spring animation, and re-enables background click-through.

---

### User Story 4 - Visual State Indicator & Minimal Voice Placeholder (Priority: P2)

As a user opening the voice assistant, I want to see a clear microphone icon, live audio wave animation placeholder, and dynamic status text inside the expanded card so that I have immediate feedback that the system is ready for voice input.

**Why this priority**: Clear visual states (Idle vs. Listening) establish user trust and confirm readiness for subsequent voice-to-text integration.

**Independent Test**: Can be tested by opening the notch and verifying the presence of the pulsing mic badge, dynamic waveform bars, and clean typography.

**Acceptance Scenarios**:

1. **Given** the notch expands, **When** the listening state is active, **Then** animated waveform bars fluctuate dynamically and the status label displays "Listening...".
2. **Given** the notch closes, **When** the retraction animation completes, **Then** the audio visualizer pauses and the UI switches to the compact idle badge.

---

## Functional Requirements

- **FR-001**: The application MUST run as a lightweight desktop process using Tauri 2.0 with a frameless, transparent, always-on-top window positioned at `top: 0, left: 50%` of the **primary display**.
- **FR-002**: The application MUST register a global system keyboard shortcut bound to `Ctrl + Alt + Enter`.
- **FR-003**: The shortcut MUST toggle between Open (expanded state) and Closed (retracted state).
- **FR-004**: The window MUST dismiss (retract) when the `Escape` key is pressed or when an outside click/blur occurs while open.
- **FR-005**: All open and close state transitions MUST be animated using spring physics (target duration 400ms–550ms with elastic easing).
- **FR-006**: The notch MUST render concave shoulder curves at the top-left and top-right junctions connecting seamlessly to the top bezel.
- **FR-007**: When in closed/idle mode, the window MUST enable click-through for all non-interactive transparent regions via `set_ignore_cursor_events(true)`.
- **FR-008**: The idle background RAM consumption MUST remain strictly under 35MB.

---

## State Machine

```
┌────────────────────────────────────────────────────────┐
│                      [ IDLE NOTCH ]                    │
│   - Position: Primary Display Top-Center               │
│   - Size: 170px x 28px                                 │
│   - Transparent window background                      │
│   - Click-through enabled on outer bounds              │
└────────────────────────────────────────────────────────┘
            │                                ▲
  [Ctrl+Alt+Enter]            [Ctrl+Alt+Enter] / [Esc] / [Blur]
  (Spring Expand)                     (Spring Retract)
            ▼                                │
┌────────────────────────────────────────────────────────┐
│                   [ EXPANDED ISLAND ]                  │
│   - Size: 440px x 110px                                │
│   - Frosted Obsidian Glass + Glowing Edge Aura         │
│   - Waveform Visualizer + Listening State Badge        │
│   - Interactive Pointer Event Capture                  │
└────────────────────────────────────────────────────────┘
```

---

## Success Criteria

1. **Sub-50ms Hotkey Response**: Pressing `Ctrl + Alt + Enter` triggers the visual expansion animation in less than 50ms from keypress.
2. **Zero Visual Stutter**: The opening and closing animations maintain a consistent 60+ FPS on standard 60Hz/120Hz displays.
3. **100% Reliable Toggle**: The global hotkey reliably opens and closes the window across 50 consecutive cycles without process hang or shortcut unregistration.
4. **Lightweight Footprint**: Memory consumption in the background remains below 35MB RAM, and idle CPU usage remains under 0.1%.
5. **Clean Click-through & Auto-dismiss**: Clicking outside while open retracts the notch instantly without leaving dangling focus locks.

---

## Assumptions

- The initial global hotkey is configured to `Ctrl + Alt + Enter` as requested, with support for future user customization in settings.
- The desktop operating system is Arch Linux (X11 / Wayland) or macOS / Windows with full support for transparent frameless windows via Tauri 2.0.
- Web audio hardware integration and streaming STT models will be connected in subsequent feature increments following this foundation.
