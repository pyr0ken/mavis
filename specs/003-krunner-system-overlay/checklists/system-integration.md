# System Integration & Multi-Workspace Requirements Quality Checklist: KRunner-Style Overlay

**Feature**: [specs/003-krunner-system-overlay/spec.md](../spec.md)  
**Created**: 2026-09-21  
**Audience**: Requirements Reviewer & System Architect (Deep Edge-Case Audit)  
**Ownership Note**: Checkbox items represent reviewer-verified requirement quality ("Unit Tests for English"). An item marked `[x]` signifies that the requirement specification itself is complete, unambiguous, and testable.

---

## 1. Requirement Completeness

- [ ] CHK001 - Are multi-workspace persistence requirements explicitly defined across all supported Linux desktop environments (KDE Plasma, GNOME, XFCE)? [Completeness, Spec §FR-001]
- [ ] CHK002 - Is the behavior specified when new virtual desktops are dynamically created or deleted while the overlay daemon is running? [Edge Cases, Gap]
- [ ] CHK003 - Are the exact mechanisms for taskbar and dock exclusion documented without conflicting with system tray presence? [Completeness, Spec §FR-003]
- [ ] CHK004 - Are requirements specified for primary monitor re-anchoring when external displays are connected, disconnected, or resolution changes? [Edge Cases, Gap]
- [ ] CHK005 - Does the specification define fallback behavior if the operating system compositor rejects `set_visible_on_all_workspaces` requests? [Resilience, Spec §FR-007]

---

## 2. Requirement Clarity & Measurability

- [ ] CHK006 - Is the hotkey activation latency threshold objectively quantified with an exact measurement boundary (e.g. `< 50ms` from hardware keydown)? [Clarity, Spec §FR-008]
- [ ] CHK007 - Is the term "Sticky / Omnipresent" quantified in terms of viewport frame stability during 3D workspace cube/glide transitions? [Clarity, Spec §FR-001]
- [ ] CHK008 - Are the exact pixel coordinates and screen bounding box for primary display top-center alignment mathematically specified? [Clarity, Spec §FR-006]
- [ ] CHK009 - Is the background memory budget objectively measurable under idle standby conditions (`< 35MB RAM`)? [Measurability, Spec §FR-010]
- [ ] CHK010 - Is the click-through cursor pass-through behavior quantified with distinct hit-test geometry versus transparent padding? [Clarity, Spec §FR-005]

---

## 3. Requirement Consistency & Alignment

- [ ] CHK011 - Do the workspace persistence requirements align with Constitution Principle II regarding lightweight floating architecture? [Consistency, Constitution §II]
- [ ] CHK012 - Are window level requirements (`always_on_top`) consistent across both idle notch and expanded Action Card modal states? [Consistency, Spec §FR-002]
- [ ] CHK013 - Do the keyboard focus acquisition and dismissal rules align between global shortcut triggers, `Escape` key, and outside backdrop blur? [Consistency, Spec §FR-009]
- [ ] CHK014 - Is the window identifier (`voice-island`) consistently named across application manifests, Tauri configs, and KWin rule contracts? [Consistency, Spec §FR-007]

---

## 4. Edge Case & Exception Scenario Coverage

- [ ] CHK015 - Does the specification define what happens if the user switches virtual desktops in the middle of active speech-to-text audio streaming? [Edge Cases, Spec §User Story 1]
- [ ] CHK016 - Are requirements defined for handling exclusive full-screen games or video players that override standard `always_on_top` window layers? [Edge Cases, Gap]
- [ ] CHK017 - Is error recovery specified if a global shortcut registration fails due to hotkey collision with existing desktop environment shortcuts? [Exception Flow, Gap]
- [ ] CHK018 - Are requirements specified for graceful handling during compositor restarts or Wayland session locks (screen lock / sleep)? [Resilience, Gap]
- [ ] CHK019 - Does the spec define cursor pass-through state recovery if an expanded card is interrupted by an unexpected OS focus-stealing popup? [Exception Flow, Spec §FR-005]

---

## 5. Non-Functional & Compositor Governance

- [ ] CHK020 - Are CPU utilization thresholds under background keyhook idling constrained to `< 0.1% CPU`? [Non-Functional, Spec §FR-010]
- [ ] CHK021 - Is zero frame-dropping / layout jitter specified for multi-workspace glide animations at 60Hz and 120Hz refresh rates? [Non-Functional, Spec §Success Criteria 1]
- [ ] CHK022 - Are privacy requirements specified to guarantee zero audio capture or microphone querying while the overlay is in `DAEMON_IDLE`? [Security & Privacy, Constitution §III]
- [ ] CHK023 - Are declarative KWin rule contract requirements documented for offline installation in KDE Plasma configurations? [Traceability, Contract §3]

---

## Notes

- Total Requirements Quality Review Items: 23
- All items evaluate requirements completeness, clarity, measurability, consistency, and edge-case coverage.
- To be reviewed and approved by the reviewer before final implementation closure.
