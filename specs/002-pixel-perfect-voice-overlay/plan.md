# Implementation Plan: Pixel-Perfect High-Fidelity Mavis Overlay

**Feature Directory**: `specs/002-pixel-perfect-voice-overlay`
**Created**: 2026-09-20
**Status**: Completed Planning (Ready for Tasks / Implementation)

## 1. Technical Context

- **Framework**: Tauri 2.0 + React 19 + TypeScript + Tailwind CSS
- **Animation Engine**: GSAP (GreenSock) for spring physics timelines
- **Avatar Generator**: `blobatar` / `@blobatar/react` (`https://blobatar.dev/`)
- **Audio Visualizer**: Web Audio API AnalyserNode + multi-harmonic sine wave fallback
- **Color Palette & Glass**: Obsidian `#16181F`, Apple Intelligence rim glow `#2B7FFF` / `#38BDF8`, 1px crisp borders `rgba(255, 255, 255, 0.12)`.

---

## 2. Constitution Check

| Principle | Status | Evaluation |
| :--- | :--- | :--- |
| **I. Fluid Spring Physics** | **PASSED** | Multi-surface GSAP spring timelines with elastic easing. |
| **II. Ultra-Lightweight Desktop** | **PASSED** | React 19 + zero heavy runtime libraries; total bundle < 150KB. |
| **III. Privacy-First Audio** | **PASSED** | No unprompted audio recording; FFT visualizer operates locally. |
| **IV. Structured Intent Execution** | **PASSED** | Dedicated Action Cards for Gmail & Calendar with live typing and Success HUD. |
| **V. Layered Architecture** | **PASSED** | Decoupled presentation (`src/components/`), state management (`src/types/`, `src/hooks/`), and native layer. |
| **VI. Dark Elegance Aesthetics** | **PASSED** | Pixel-perfect parity with screencast; electric blue rim light, obsidian dark glass, and Blobatar avatars. |

---

## 3. Phase Breakdown & Implementation Steps

### Phase 1: Core Surface Architecture & Types
1. Update `src/types/island.ts` with new state machine (`hidden`, `idle`, `listening`, `action`, `success`) and intent models (`GmailDraftIntent`, `CalendarEventIntent`).
2. Build `src/components/AppleIntelligenceGlow.tsx` with focused electric blue/cyan perimeter contour box-shadow.
3. Update `src/components/ConcaveShoulders.tsx` for seamless top-bezel squircle docking.

### Phase 2: Action Cards & Contact Avatars
1. Create `src/components/ContactChip.tsx` integrating `@blobatar/react` (`<Blobatar name="david@company.com" animate="hover" />`).
2. Create `src/components/GmailComposeCard.tsx` with Gmail branding, editable subject/body, live typewriter streaming, and "Send" CTA.
3. Create `src/components/CalendarEventCard.tsx` with Calendar branding, blue focus underline on title, date/time row, attendee chip, Google Meet row, and "Save" CTA.
4. Create `src/components/SuccessCapsule.tsx` with floating status toast and 1.8s auto-retraction.

### Phase 3: Animation Timeline & Unified Notch Container
1. Re-engineer `src/hooks/useIslandAnimation.ts` to manage the multi-surface choreography (Notch expand $\rightarrow$ Card unfold $\rightarrow$ Field typewriter $\rightarrow$ Success morph $\rightarrow$ Retract).
2. Refactor `src/components/NotchContainer.tsx` to mount both the Top Notch Shell and the Dropdown Action Card.
3. Update `src/App.tsx` with hybrid controls (`1` for Gmail, `2` for Calendar, `Space` for Listening, `Escape` for dismiss).

### Phase 4: Quality Verification & Build
1. Execute `npm run build` and resolve any TypeScript/lint errors.
2. Verify visual fidelity against all reference video frames.
