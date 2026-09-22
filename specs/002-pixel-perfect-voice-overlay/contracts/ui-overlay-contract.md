# UI Component & State Contract: Mavis High-Fidelity Overlay

**Feature**: `specs/002-pixel-perfect-voice-overlay`
**Created**: 2026-09-20

## 1. Top Notch Component Contract (`NotchHeader.tsx`)

```typescript
export interface NotchHeaderProps {
  state: IslandState;
  onNotchClick: () => void;
  activeIntentType?: ActionCardType;
}
```
- **Idle State**: Displays Globe icon (`🌐`) and pulsing hardware dot.
- **Listening State**: Displays 4-bar dynamic audio equalizer.
- **Action / Dropdown State**: Serves as the top anchor bar connecting with SVG concave shoulders.

---

## 2. Dropdown Action Card Contract (`DropdownCard.tsx`)

```typescript
export interface DropdownCardProps {
  active: boolean;
  intentType: ActionCardType;
  onActionComplete: () => void;
  onCancel: () => void;
}
```
- **Transitions**: Smoothly scales/slides down when `active: true`.
- **Styling**: `width: 540px`, obsidian glass `#16181F`, backdrop blur `28px`, Apple Intelligence electric blue rim glow.
- **Actions**: Clicking CTA button (`Send` / `Save`) triggers `onActionComplete()` $\rightarrow$ transitions to `SuccessCapsule`.

---

## 3. Contact Chip with Blobatar Contract (`ContactChip.tsx`)

```typescript
export interface ContactChipProps {
  name?: string;
  email: string;
  label?: string; // e.g. "To"
}
```
- Renders `<Blobatar name={email} animate="hover" />` inside the chip capsule.
- Fallback gracefully if render delays.

---

## 4. Floating Success Capsule Contract (`SuccessCapsule.tsx`)

```typescript
export interface SuccessCapsuleProps {
  intentType: ActionCardType;
  onDismiss: () => void;
  durationMs?: number; // default: 1800ms
}
```
- Displays app icon + status text (`Email sent ✓` or `Scheduled .`).
- Automatically fires `onDismiss()` after `durationMs`.
