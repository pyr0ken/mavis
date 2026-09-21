# Quickstart & Verification Guide: Voice Island High-Fidelity Overlay

**Feature**: `specs/002-pixel-perfect-voice-overlay`
**Created**: 2026-09-20

## Prerequisites

- Node.js 18+ & npm
- Linux / macOS / Windows desktop

## Running the Verification Build

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build & Typecheck verification
npm run build
```

## Interactive Verification Scenarios

1. **Idle State (`Ctrl + Alt` or toggle)**:
   - Small black notch pill (`210px x 34px`) drops down at `top: 0, left: 50%`.
   - 3D Globe icon visible on left, concave SVG shoulders smoothly attached to top screen bezel.
2. **Listening State (`Space` or click notch)**:
   - Notch widens smoothly to `280px x 38px`.
   - 4-bar dynamic audio equalizer animates smoothly.
3. **Gmail Action Card (`1` key or click)**:
   - Dropdown card cascades down with electric cyan/blue Apple Intelligence rim glow.
   - Gmail "New Message" header, `david@company.com` chip with animated deterministic Blobatar, live typewriter text for subject and body.
   - Click "Send" $\rightarrow$ transforms to `"Email sent ✓"` floating capsule $\rightarrow$ auto-retracts after 1.8s.
4. **Google Calendar Action Card (`2` key)**:
   - Dropdown card unfolds with Google Calendar logo and "New Event".
   - Event title underlined in electric blue, clock row, attendee chip with Blobatar, Google Meet row.
   - Click "Save" $\rightarrow$ transforms to `"Scheduled ."` floating capsule $\rightarrow$ auto-retracts after 1.8s.
5. **Dismissal (`Escape` or click outside)**:
   - Overlay immediately collapses and retracts into the top bezel.
