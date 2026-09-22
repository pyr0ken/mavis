# Feature Specification: Pixel-Perfect High-Fidelity Mavis Overlay & Action Cards

**Feature Directory**: `specs/002-pixel-perfect-voice-overlay`

**Created**: 2026-09-20

**Status**: Ready for Planning

**Input**: User analysis request based on screen recording (`Screencast_20260920_135114.mp4`):
> "بررسی دقیق و کامل ویدیو، استخراج تمام استایلها، انیمیشنها، ابعاد، ساختار چندسطحی (Multi-Surface Dropdown Card)، نورپردازی کانتور نئونی (Apple Intelligence Cyan/Blue Glow)، اصلاح اندازه و وضوح و رفع تاری بیش از حد، و پیادهسازی صفحه دوم اکشن کارتهای وویس ایجنت (Gmail New Message و Google Calendar New Event به همراه Success Toast Pills)."

---

## Clarifications

### Session 2026-09-20
- Q: How should the user trigger and switch between the different Action Card modes (Gmail Composer, Google Calendar Event, and Voice Waveform) during interactive testing and use? → A: Option A - Hybrid Demo Controls + Voice Intent (Notch click cycles listening/cards, keyboard shortcuts 1: Gmail, 2: Calendar, Space: Listen trigger cards directly, and mock speech phrases route to corresponding templates).
- Q: When an Action Card (Gmail Composer or Calendar Event) is unfolded and populated, should the input fields remain interactive for manual typing/editing prior to pressing Send/Save? → A: Option A - Editable Inputs with Typewriter Streaming (Fields stream in automatically character-by-character, and users can click inside to edit text, change recipients, or adjust details before clicking Send/Save).
- Q: How should the audio equalizer bars inside the notch behave during active listening state? → A: Option A - Real Mic FFT with Organic Fallback (Uses Web Audio API FFT data when mic is available, with realistic organic sine-wave fluctuation as a fallback).
- Q: How should recipient and attendee avatars be rendered inside the contact chips across Action Cards? → A: Option A - Deterministic Geometric Blobatars (Uses `blobatar` / `@blobatar/react` to deterministically generate zero-dependency animated SVG geometric avatars from strings like `david@company.com`, giving every contact a distinct personality).

---

## Executive Summary & Video Reverse-Engineering Breakdown

A comprehensive frame-by-frame analysis of the 28.75s reference screencast reveals that **Mavis** operates as a sophisticated **multi-surface dynamic operating system HUD**, consisting of three distinct visual planes rather than a single morphing pill:

1. **Hardware-Anchored Top Notch (Bezel Shell)**:
   - Always anchored to `top: 0, left: 50%` with concave shoulder fillets (`border-radius` transitions into top menu bar).
   - Solid obsidian matte black (`#0B0E14` / `#000000`) with high contrast.
   - Houses system indicators:
     - Left: 3D Globe icon (`🌐`) in idle state; active 4-bar equalizer waveform visualizer or pulsing ellipsis dots (`••••`) during voice input.
     - Right: Status pulse / camera indicator.
2. **Cascading Voice Agent Action Card (Floating Dropdown Panel)**:
   - When a voice command or intent is detected, an expanded **Action Modal Card** smoothly unfolds/drops down directly beneath the notch.
   - Dimensions: `width: 520px - 560px`, `height: 240px - 320px` (spacious, highly legible, non-cramped).
   - Surface Material: Deep charcoal/obsidian glass (`#1C1C1E` / `#22242B`) with crisp `1px solid rgba(255, 255, 255, 0.12)` borders, subtle inner top bevel highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.15)`), and hardware backdrop blur (`backdrop-filter: blur(28px) saturate(180%)`).
   - Outer Neon Perimeter Aura: Apple Intelligence-style electric cyan/blue perimeter glow (`#2B7FFF` / `#38BDF8` rim light) hugging the outer contour with controlled diffusion (crisp, not a muddy blurry rainbow).
3. **Structured Intent Templates & Interactive Flow**:
   - **Template A (Gmail Composer - "New Message")**:
     - Header: Google Gmail logo + "New Message" title.
     - Recipient Row: "To" label + `david@company.com` capsule chip badge.
     - Subject Row: Dynamic typewriter typing ("Project update and Thursday sync") with thin separator.
     - Body Area: Formatted draft email with greeting, body, and sign-off.
     - Action CTA: Vibrant blue pill button ("Send") at bottom-right.
   - **Template B (Google Calendar - "New Event")**:
     - Header: Google Calendar logo + "New Event" title.
     - Event Title: "Design review with David" with an electric blue focus underline.
     - Parameter Rows: Clock icon (Date & Time: `Thursday · 2:00 – 2:30 PM`), User icon (Attendee: `david@company.com` chip), Video Camera icon (`Google Meet`).
     - Action CTA: Vibrant blue pill button ("Save") at bottom-right.
   - **Template C (Floating Success Capsule HUD)**:
     - Upon pressing Send/Save or completing action, the large modal smoothly collapses into a floating, glassmorphic capsule badge:
       - Gmail confirmation: Gmail logo + `"Email sent"` + checkmark `✓`.
       - Calendar confirmation: Calendar logo + `"Scheduled ."`
     - Rests for 1.8s, then smoothly retracts back into the top bezel.

---

## Visual Comparison: Current Codebase vs. Target Screencast

| Dimension / Aspect | Current Codebase (`specs/001`) | Target Reference (`Screencast`) | Gap / Required Fix |
| :--- | :--- | :--- | :--- |
| **Architectural Model** | Single box expanding from 200x32px to 460x115px | Multi-surface: Top Notch + Cascading Dropdown Action Card | Separate notch header from dropdown card modal |
| **Expanded Width / Height** | 460px x 115px (cramped, small, text cut off) | 540px width, 260px–310px height (generous, readable) | Expand container footprint to full desktop-grade HUD |
| **Glow & Border Aesthetic** | Blurry 10px conic rainbow (`#f472b6`, `#fb923c`, etc.) | Electric blue / cyan Apple Intelligence perimeter rim light | Replace conic rainbow with crisp `#38bdf8` / `#2563eb` outer glow |
| **Glass & Background Clarity** | Muddy `#0d111c/95` background, low contrast | Crisp obsidian `#181A20` with sharp 1px border and inner bevel | Add distinct header bar (`#242731`), sharp divider lines, high-contrast typography |
| **Action Templates** | Generic "VoiceOS" listening placeholder | Rich Gmail ("New Message") and Calendar ("New Event") cards | Build modular Action Card components with live typewriter fill |
| **Contact & Attendee Avatars** | Generic static icons / silhouette | Deterministic geometric Blobatars (`blobatar.dev`) with micro-animations | Integrate `@blobatar/react` to render animated deterministic avatars from email strings |
| **Success HUD State** | None (abruptly closes or stays open) | Floating capsule badge ("Email sent ✓", "Scheduled .") | Implement state transition to floating success capsule |
| **Animation Choreography** | Single GSAP tween on container | Multi-stage timeline: Notch expand $\rightarrow$ Card drop $\rightarrow$ Typing $\rightarrow$ Success morph $\rightarrow$ Retract | Staggered spring timeline with realistic physics |

---

## User Scenarios & Testing

### User Story 1 - Multi-Surface Notch & Card Morphing (Priority: P1)

As a desktop user triggering Mavis, I want the top notch to expand smoothly and deploy a crisp, high-contrast action card below it, so that I can clearly view and interact with generated tasks (emails, calendar events, summaries) without visual muddiness or cramped layouts.

**Why this priority**: Solves the primary visual defect reported by the user: lack of clarity, small size, blurry rainbow artifacts, and absence of the second-stage voice agent panel.

**Independent Test**: Can be tested by invoking the overlay and verifying that the top notch expands and smoothly cascades a 540px-wide obsidian glass card with an electric blue rim aura and sharp internal hierarchy.

**Acceptance Scenarios**:
1. **Given** the system is in Idle state, **When** voice input or expansion is triggered, **Then** the top notch expands horizontally, and the Action Card smoothly unfolds downward using spring physics (`ease: elastic.out(1, 0.8)` or custom cubic-bezier).
2. **Given** the expanded card is visible, **When** rendered on high-DPI displays, **Then** all borders (`1px solid rgba(255, 255, 255, 0.12)`), text labels, and icons render razor-sharp without blur artifacts.
3. **Given** the electric cyan perimeter glow, **When** active, **Then** the glow is concentrated along the outer contour without bleeding into or muddying the interior card text.

---

### User Story 2 - Rich Interactive Action Card Templates (Priority: P1)

As a voice assistant user, I want the system to render purpose-built action cards for common intents (Gmail email composer and Google Calendar event scheduler) with typewriter text populating fields in real-time, so that I can inspect, edit, and confirm actions before execution.

**Why this priority**: Delivers the exact workflow demonstrated in the video where structured agent intents (email drafting and meeting scheduling) are surfaced as native interactive cards.

**Independent Test**: Can be tested by selecting or switching between the "Email Compose" and "Calendar Schedule" mock/live intents and asserting that fields, chips, icons, and action buttons render with pixel-perfect fidelity.

**Acceptance Scenarios**:
1. **Given** an email intent, **When** the card unfolds, **Then** the Gmail logo, "New Message" header, "To" chip (`david@company.com`), dynamic subject line, multi-line body, and blue "Send" button are displayed.
2. **Given** a calendar intent, **When** the card unfolds, **Then** the Calendar logo, "New Event" header, underlined title input ("Design review with David"), Date/Time row, Attendee chip, Google Meet row, and blue "Save" button are displayed.
3. **Given** active text generation, **When** fields populate, **Then** a smooth typewriter stream updates text character-by-character with an active cursor indicator.

---

### User Story 3 - Success Toast Capsule & Automatic Retraction (Priority: P2)

As a user confirming an action (clicking Send / Save), I want the large card to smoothly morph into a compact floating capsule toast ("Email sent ✓" or "Scheduled ."), persist briefly, and cleanly retract back into the top notch.

**Why this priority**: Closes the full interaction loop shown in the video, delivering seamless feedback and returning the desktop to an unobtrusive idle state.

**Independent Test**: Can be tested by clicking the action button (or pressing Enter) and measuring the transition timeline into the success capsule and subsequent auto-dismissal after 1.8 seconds.

**Acceptance Scenarios**:
1. **Given** an active action card, **When** the user clicks the CTA button ("Send" or "Save"), **Then** the large card collapses into a floating pill badge (`~210px x 38px`) displaying the corresponding app icon, status text, and checkmark.
2. **Given** the success capsule is displayed, **When** 1.8 seconds elapse without user interaction, **Then** the capsule smoothly retracts upward into the top bezel.
3. **Given** an open card or capsule, **When** the user clicks outside or presses `Escape`, **Then** the entire overlay immediately retracts cleanly.

---

## Functional Requirements

- **FR-001**: The overlay architecture MUST decouple the **Top Notch Header** (`height: 34px`) from the **Cascading Dropdown Card** (`width: 540px`, `height: 260px - 310px`).
- **FR-002**: The top notch MUST retain smooth SVG concave shoulders (`width: 14px`, `height: 14px`) flush with the top screen bezel.
- **FR-003**: The idle notch MUST feature a 3D Globe icon (`🌐`) on the left and a hardware status indicator dot.
- **FR-004**: In listening mode, the notch MUST display an animated 4-bar equalizer waveform or pulsing dot loader (`••••`).
- **FR-005**: The dropdown card MUST use an obsidian dark-glass palette:
  - Card background: `#16181F` with `backdrop-filter: blur(28px) saturate(180%)`.
  - Header segment: `#1F222B` with rounded upper corners.
  - Border: `1px solid rgba(255, 255, 255, 0.12)`.
  - Inner top highlight: `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15)`.
- **FR-006**: The glowing perimeter rim MUST use an Apple Intelligence-inspired cyan/electric blue halo (`box-shadow: 0 0 30px -4px rgba(43, 127, 255, 0.45), 0 0 0 1px rgba(56, 189, 248, 0.5)`), completely eliminating blurry rainbow artifacts.
- **FR-007**: The system MUST implement the **Gmail Action Card** with:
  - Colored Gmail envelope logo + "New Message" title.
  - "To" field with email recipient pill chip (`david@company.com`) featuring a deterministic animated Blobatar avatar (`@blobatar/react`).
  - Subject input line with typewriter stream.
  - Formatted message body area.
  - Pill-shaped "Send" button (`bg-[#2B7FFF] hover:bg-[#1A68E5] text-white`).
- **FR-008**: The system MUST implement the **Google Calendar Action Card** with:
  - Google Calendar logo + "New Event" title.
  - Event title field with electric blue accent underline.
  - Date & Time row (`🕒 Thursday · 2:00 – 2:30 PM`).
  - Attendee row (`david@company.com` chip with animated deterministic Blobatar avatar).
  - Video call row (`📹 Google Meet`).
  - Pill-shaped "Save" button (`bg-[#2B7FFF] hover:bg-[#1A68E5] text-white`).
- **FR-009**: The system MUST support morphing from the Action Card into a **Success Capsule Pill**:
  - Email sent state: Gmail icon + `"Email sent"` + `✓`.
  - Event scheduled state: Calendar icon + `"Scheduled ."`
  - Auto-retract delay: 1800ms.
- **FR-010**: All morphing animations MUST use GSAP / spring physics with staggered multi-stage execution and zero layout jitter.
- **FR-011**: The application MUST support hybrid interactive controls for mode switching: clicking the notch cycles states, number hotkeys (`1`: Gmail Compose, `2`: Calendar Event, `Space`: Voice Waveform) switch templates directly, and mock speech strings route dynamically.
- **FR-012**: Form fields within Action Cards MUST be fully interactive and editable HTML elements with live typewriter stream population, allowing users to click in and edit text prior to clicking Send or Save.
- **FR-013**: The 4-bar equalizer within the notch MUST process live microphone FFT audio levels via Web Audio API with a graceful fallback to multi-harmonic organic sine wave animations when microphone access is inactive or simulated.
- **FR-014**: The application MUST integrate `@blobatar/react` (`blobatar`) to generate zero-dependency, deterministic geometric SVG blobatars for contacts and attendees based on their identity string (e.g. `david@company.com`), including breathing and hover animations.

---

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                       [ HIDDEN ]                            │
│   - y: -120px, opacity: 0, click-through: true              │
└─────────────────────────────────────────────────────────────┘
                               │ [Ctrl+Alt / Hotkey]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      [ IDLE NOTCH ]                         │
│   - Dimensions: 210px x 34px, rounded squircle              │
│   - Top bezel concave shoulders                             │
│   - Globe icon (🌐) + Hardware status dot                   │
└─────────────────────────────────────────────────────────────┘
                               │ [Click / Voice Intent]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   [ LISTENING / EXPANDING ]                 │
│   - Notch expands horizontally (280px x 38px)               │
│   - Animated 4-bar audio equalizer / pulsing dots (••••)    │
│   - Microphone stream active                                │
└─────────────────────────────────────────────────────────────┘
                               │ [Intent Resolved / Unfold]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  [ ACTION CARD DROPDOWN ]                   │
│   - Card dimensions: 540px x 280px (spacious & sharp)       │
│   - Obsidian glass (#16181F) + Apple Intelligence Blue Rim  │
│   - Mode A: Gmail Composer ("New Message" + To/Subject/Body)│
│   - Mode B: Calendar ("New Event" + Underline/Time/Meet)    │
│   - Real-time typewriter field streaming                    │
│   - Interactive Action Button ("Send" / "Save")             │
└─────────────────────────────────────────────────────────────┘
                               │ [Click Send/Save / Enter]
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  [ SUCCESS CAPSULE HUD ]                    │
│   - Floating capsule pill (180px x 38px)                    │
│   - Gmail / Calendar Icon + "Email sent ✓" / "Scheduled ."  │
│   - Translucent glass with subtle glow                      │
│   - Auto-retract timer: 1.8s                                │
└─────────────────────────────────────────────────────────────┘
                               │ [Timer Expired / Esc / Blur]
                               ▼
                        [ IDLE NOTCH / HIDDEN ]
```

---

## Success Criteria

1. **Pixel-Perfect Visual Parity**: All visual properties (card dimensions, typography scale, 1px border highlights, Apple Intelligence blue rim glow, Gmail/Calendar templates, and Success Capsule) match the reference screencast precisely.
2. **Crystal Clear High-DPI Rendering**: Zero blurry rainbow bleeding; text is crisp and legible across all dark-mode layers.
3. **Smooth Multi-Surface Animation**: 60+ FPS spring animations for notch expansion, card dropdown cascade, typewriter stream, and capsule collapse.
4. **Intuitive Interactive Loop**: Complete end-to-end interactive demo allowing switching between Gmail, Calendar, and Listening states with active CTA buttons and success toasts.
5. **Robust Auto-Dismissal**: Clicking outside, pressing `Escape`, or waiting out the success timer reliably returns the UI to the compact notch.

---

## Assumptions

- The frontend application is built in React 19 + TypeScript + Tailwind CSS + GSAP inside the existing Tauri 2.0 shell.
- Demo intents (Gmail compose and Calendar event) will include realistic mock streaming and typing simulations to showcase the visual fidelity before live backend API connections.
