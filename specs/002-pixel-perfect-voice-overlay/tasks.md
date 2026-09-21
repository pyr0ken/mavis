# Tasks: Pixel-Perfect High-Fidelity Voice Island Overlay & Action Cards

**Feature Directory**: `specs/002-pixel-perfect-voice-overlay`  
**Status**: Completed  
**Target Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Dependency Graph & Implementation Strategy

```
Phase 1: Setup & Dependencies (T001-T003) [COMPLETED]
        │
        ▼
Phase 2: Foundational Types, State Models & CSS (T004-T006) [COMPLETED]
        │
        ├─────────────────────────────────────────┐
        ▼                                         ▼
Phase 3: US1 - Multi-Surface Notch & Card (T007-T011)   Phase 4: US2 - Action Cards & Blobatars (T012-T017) [COMPLETED]
        │                                         │
        └───────────────────┬─────────────────────┘
                            ▼
Phase 5: US3 - Success Toast Capsule & Retraction (T018-T021) [COMPLETED]
                            │
                            ▼
Phase 6: Polish, Hybrid Controls & Build Verification (T022-T026) [COMPLETED]
```

---

## Phase 1: Setup & Dependencies

- [x] T001 Install `@blobatar/react` and `blobatar` dependencies in `package.json`
- [x] T002 [P] Import `blobatar/motion.css` and configure motion stylesheet in `src/index.css`
- [x] T003 [P] Verify package dependencies and TypeScript definitions in `tsconfig.json`

---

## Phase 2: Foundational Architecture, Types & CSS Tokens

- [x] T004 [P] Define comprehensive multi-surface island types (`IslandState`, `ActionCardType`, `GmailDraftIntent`, `CalendarEventIntent`, `NOTCH_GEOMETRIES`) in `src/types/island.ts`
- [x] T005 [P] Implement Apple Intelligence cyan/electric blue halo glow utility classes and obsidian dark-glass tokens (`#16181F`, `#1F222B`, `border-white/12`) in `src/index.css`
- [x] T006 [P] Update Tailwind configuration for custom animation easings and box-shadow layers in `tailwind.config.js`

---

## Phase 3: User Story 1 - Multi-Surface Notch & Card Morphing [P1]

> **Goal**: Replace single-box morphing with a dual-surface architecture (Top Notch Header + Cascading Dropdown Action Card) with crisp 1px borders and Apple Intelligence rim glow.

- [x] T007 [P] [US1] Build `AppleIntelligenceGlow` component with focused cyan/blue rim light (`box-shadow: 0 0 35px -4px rgba(43, 127, 255, 0.45)`) in `src/components/AppleIntelligenceGlow.tsx`
- [x] T008 [P] [US1] Update `ConcaveShoulders` SVG inverted fillets for seamless top-bezel squircle docking in `src/components/ConcaveShoulders.tsx`
- [x] T009 [P] [US1] Build 4-bar dynamic audio equalizer component (`AudioWaveformBars`) with Web Audio API FFT support and multi-harmonic sine fallback in `src/components/AudioWaveformBars.tsx`
- [x] T010 [US1] Re-engineer GSAP animation timeline hook (`useIslandAnimation`) for multi-stage spring transitions in `src/hooks/useIslandAnimation.ts`
- [x] T011 [US1] Rebuild `NotchContainer` to host both the top bezel notch shell and the cascading dropdown container in `src/components/NotchContainer.tsx`

---

## Phase 4: User Story 2 - Rich Interactive Action Cards & Blobatar Avatars [P1]

> **Goal**: Implement high-fidelity Gmail Composer and Google Calendar Event cards with live typewriter streaming and deterministic Blobatar contact avatars.

- [x] T012 [P] [US2] Build `ContactChip` component integrating `@blobatar/react` (`<Blobatar name={email} animate="hover" />`) in `src/components/ContactChip.tsx`
- [x] T013 [P] [US2] Implement `GmailComposeCard` with Gmail logo, "New Message" header, editable To/Subject/Body fields, typewriter animation, and blue "Send" CTA in `src/components/GmailComposeCard.tsx`
- [x] T014 [P] [US2] Implement `CalendarEventCard` with Calendar logo, "New Event" header, blue focus underline on title, date/time row, attendee chip, Google Meet row, and blue "Save" CTA in `src/components/CalendarEventCard.tsx`
- [x] T015 [US2] Build unified `DropdownCard` container orchestrating template rendering, electric blue rim aura, and CTA event bubbling in `src/components/DropdownCard.tsx`
- [x] T016 [US2] Implement live typewriter streaming hook (`useTypewriterStream`) with cursor pulse in `src/hooks/useTypewriterStream.ts`
- [x] T017 [US2] Wire Action Cards and template selection inside `src/components/NotchContainer.tsx`

---

## Phase 5: User Story 3 - Success Toast Capsule & Automatic Retraction [P2]

> **Goal**: Collapse the large action card into a floating capsule HUD toast upon confirmation and cleanly retract after 1.8 seconds.

- [x] T018 [P] [US3] Build floating `SuccessCapsule` component rendering Gmail ("Email sent ✓") and Calendar ("Scheduled .") capsule HUDs in `src/components/SuccessCapsule.tsx`
- [x] T019 [US3] Implement auto-retract timer (1800ms) with cancellation on manual dismiss in `src/components/SuccessCapsule.tsx`
- [x] T020 [US3] Add GSAP collapse morphing transition from `DropdownCard` into `SuccessCapsule` in `src/hooks/useIslandAnimation.ts`
- [x] T021 [US3] Integrate `SuccessCapsule` mounting and dismissal callbacks in `src/components/NotchContainer.tsx`

---

## Phase 6: Polish, Hybrid Controls & Build Verification

- [x] T022 Update `src/App.tsx` with hybrid interaction model: Notch click cycling, hotkeys `1` (Gmail), `2` (Calendar), `Space` (Listening), and `Escape` (Dismiss)
- [x] T023 Ensure transparent backdrop click-through and outside-click retraction handler in `src/App.tsx`
- [x] T024 [P] Execute TypeScript compilation and verify zero errors with `npm run build`
- [x] T025 Verify visual fidelity, font sharpness, border contrast, and 60+ FPS animation against reference screencast frames
- [x] T026 Update requirements checklist in `specs/002-pixel-perfect-voice-overlay/checklists/requirements.md`
