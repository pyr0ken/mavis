# Data Model: Pixel-Perfect High-Fidelity Mavis Overlay

**Feature**: `specs/002-pixel-perfect-voice-overlay`
**Created**: 2026-09-20

## 1. Island & Overlay State Hierarchy

```typescript
export type IslandState = 
  | 'hidden'        // Off-screen / retracted into top bezel (y: -120px)
  | 'idle'          // Small black notch (210px x 34px) with globe icon
  | 'listening'     // Expanded notch (280px x 38px) with 4-bar equalizer
  | 'action'        // Dropdown Action Card unfolded (Gmail or Calendar)
  | 'success';      // Floating Success Capsule HUD (Email sent ✓ / Scheduled .)

export type ActionCardType = 'gmail' | 'calendar';
```

## 2. Structured Action Intent Models

### A. Gmail Compose Intent (`GmailDraftIntent`)
```typescript
export interface GmailDraftIntent {
  type: 'gmail';
  recipient: {
    name: string;
    email: string; // e.g. "david@company.com" (used as Blobatar seed)
  };
  subject: string;   // e.g. "Project update and Thursday sync"
  body: string;      // Formatted multiline message text
  actionLabel: string; // "Send"
  successMessage: string; // "Email sent"
}
```

### B. Google Calendar Event Intent (`CalendarEventIntent`)
```typescript
export interface CalendarEventIntent {
  type: 'calendar';
  title: string;       // e.g. "Design review with David"
  dateTime: string;    // e.g. "Thursday · 2:00 – 2:30 PM"
  attendee: {
    name: string;
    email: string;     // e.g. "david@company.com" (used as Blobatar seed)
  };
  locationOrService: string; // e.g. "Google Meet"
  actionLabel: string; // "Save"
  successMessage: string; // "Scheduled"
}
```

## 3. UI Geometry & Spring Configuration Model

```typescript
export interface SurfaceGeometry {
  width: number;
  height: number;
  borderRadius: string;
  duration: number;
  ease: string;
}

export const NOTCH_GEOMETRIES: Record<IslandState, SurfaceGeometry> = {
  hidden: {
    width: 210,
    height: 0,
    borderRadius: '0 0 16px 16px',
    duration: 0.25,
    ease: 'power3.in',
  },
  idle: {
    width: 210,
    height: 34,
    borderRadius: '0 0 16px 16px',
    duration: 0.38,
    ease: 'elastic.out(1, 0.85)',
  },
  listening: {
    width: 280,
    height: 38,
    borderRadius: '0 0 18px 18px',
    duration: 0.40,
    ease: 'elastic.out(1, 0.8)',
  },
  action: {
    width: 540,
    height: 38,
    borderRadius: '0 0 18px 18px',
    duration: 0.45,
    ease: 'power3.out',
  },
  success: {
    width: 210,
    height: 38,
    borderRadius: '0 0 18px 18px',
    duration: 0.35,
    ease: 'power4.inOut',
  },
};
```
