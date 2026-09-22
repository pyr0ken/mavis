# Technical Research: Pixel-Perfect High-Fidelity Mavis Overlay

**Feature**: `specs/002-pixel-perfect-voice-overlay`
**Created**: 2026-09-20

## 1. Multi-Surface Architecture & DOM Layout

### Decision
Decouple the overlay into two co-located DOM surfaces inside a single unified coordinate wrapper:
1. **Top Notch Shell (`NotchBezel`)**:
   - Anchored directly at `top: 0, left: 50%, transform: -50%`.
   - Dimensions: `210px x 34px` (Idle) morphing to `280px x 38px` (Listening).
   - Contains the Concave SVG fillets (`width: 14px, height: 14px`), Globe icon (`🌐`), and the 4-bar equalizer visualizer.
2. **Cascading Dropdown Action Card (`DropdownCard`)**:
   - Positioned directly below the notch shell with `margin-top: 8px` or anchored flush under the notch.
   - Dimensions: `width: 540px, min-height: 270px, max-height: 320px`.
   - Animates in using a staggered GSAP timeline (`y: -24 -> 0`, `opacity: 0 -> 1`, `scale: 0.96 -> 1`).
   - Renders the active template (Gmail Composer or Google Calendar Scheduler).
3. **Floating HUD Capsule Toast (`SuccessCapsule`)**:
   - Replaces the dropdown card upon action confirmation (`Send` / `Save`).
   - Dimensions: `190px x 38px`.
   - Displays application icon + text + confirmation checkmark.

### Rationale
In the reference screencast, the expanded view is not a single ballooning box; rather, the notch serves as the hardware anchor while the agent interaction panel drops down as a focused card beneath it. This separation ensures that text hierarchy, button alignment, and spacing remain crystal clear without clipping or awkward squishing.

### Alternatives Considered
- *Single-container morphing*: Cramps all content into one expanding box, causing blurry edges and tight margins. (Rejected)
- *Separate Tauri OS Windows for Notch and Card*: Introduces OS window management lag and synchronization overhead. (Rejected in favor of single-window multi-surface CSS/GSAP coordination).

---

## 2. Apple Intelligence Cyan/Blue Glow & Dark Obsidian Glass

### Decision
1. **Perimeter Rim Glow**:
   - Outer aura: `box-shadow: 0 0 35px -4px rgba(43, 127, 255, 0.45), 0 0 1px 1px rgba(56, 189, 248, 0.55)`.
   - Filter layer: Subtle high-intensity border highlight rather than a wide diffuse conic blur.
2. **Obsidian Dark Glass Material**:
   - Card background: `#16181F` / `rgba(22, 24, 31, 0.94)`.
   - Backdrop filter: `backdrop-filter: blur(28px) saturate(180%)`.
   - Header container: `#1F222B` / `rgba(31, 34, 43, 0.95)` with rounded top corners (`16px`).
   - Border definition: `1px solid rgba(255, 255, 255, 0.12)`.
   - Top highlight bevel: `inset 0 1px 0 rgba(255, 255, 255, 0.15)`.

### Rationale
The previous multi-color conic rainbow (`#f472b6`, `#fb923c`, etc.) with a 10px blur caused severe optical blurriness and did not match the crisp, premium Apple Intelligence styling seen in the video. The focused cyan/blue rim light delivers razor-sharp edge contrast against light and dark desktop wallpapers alike.

---

## 3. Deterministic Contact Avatars via Blobatar

### Decision
Integrate `@blobatar/react` and `blobatar` (`https://blobatar.dev/`) to render zero-dependency geometric SVG avatars for email recipients (`david@company.com`) and calendar attendees.
- Component: `<Blobatar name={contactEmail} animate="hover" />`
- Size: `18px x 18px` inside pill chips.
- Styling: Embedded inside dark capsule badges (`bg-[#2B2D37] border border-white/10 text-xs text-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1.5`).

### Rationale
Blobatar is deterministic (~4.4KB, zero dependencies), meaning the exact same string (`david@company.com`) always generates the identical recognizable geometric persona with interactive micro-animations (breathing and blinking), elevating the UI from generic placeholder icons to a delightful personal assistant.

---

## 4. Audio Waveform & FFT Equalizer

### Decision
Implement a 4-bar equalizer inside `AudioWaveformBars.tsx`:
- Bar count: 4 vertical rounded bars (`w-1 rounded-full bg-white`).
- When microphone is active: Reads frequency data from `AnalyserNode.getByteFrequencyData()`.
- Fallback / Demo mode: Multi-harmonic organic sine wave function `Math.sin(time * speed + index * offset)` generating fluid, natural bar heights between 4px and 18px at 60 FPS.

### Rationale
Guarantees fluid, high-fidelity visual motion during voice assistant states even when running in browser preview or before microphone permissions are granted.

---

## 5. Animation Curves & Timeline Choreography

### Decision
Use GSAP timelines with physics-inspired easings:
- **Notch Expand**: `duration: 0.38, ease: "elastic.out(1, 0.85)"`.
- **Card Unfold**: `duration: 0.42, ease: "power3.out"`, staggered 0.08s after notch starts.
- **Typewriter Effect**: 22ms per character with blinking cursor indicator.
- **Card $\rightarrow$ Success Pill**: `duration: 0.35, ease: "power4.inOut"`.
- **Success Auto-Retract**: 1.8s delay followed by `duration: 0.28, ease: "power3.in"`.
