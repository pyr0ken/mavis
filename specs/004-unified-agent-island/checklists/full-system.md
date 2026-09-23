# Requirements Quality Checklist: Full System (Unified Canvas & ReAct Agent Engine)

**Feature**: [Unified Obsidian Canvas & Native ReAct Agent Engine](../spec.md)  
**Created**: 2026-09-22  
**Target Spec**: `specs/004-unified-agent-island/spec.md`  
**Plan Reference**: `specs/004-unified-agent-island/plan.md`  

> **Ownership Note**: This checklist is a reviewer-owned requirements-quality review artifact ("Unit Tests for English"). `[x]` indicates that the reviewer confirmed the requirements-quality criterion is satisfied in the specification—it does NOT track implementation progress. All generated items start unchecked `[ ]`.

---

## 1. Requirement Completeness

- [ ] CHK001 - Are the layout, dimensional bounds, and border radii for the single-surface Obsidian Canvas explicitly specified across all viewport states? [Completeness, Spec §FR-001]
- [ ] CHK002 - Are the visual structure and placement requirements for the Live Tool Execution Pill documented for all possible execution states (`thinking`, `tool_executing`, `streaming`, `waiting_approval`)? [Completeness, Spec §FR-006]
- [ ] CHK003 - Are the complete schemas and parameter requirements defined for all built-in Rust system tools (`execute_shell`, `search_files`, `read_file`)? [Completeness, Spec §FR-005]
- [ ] CHK004 - Are the exact table schemas and virtual table indexing strategies for SQLite FTS5 documented in the data model? [Completeness, Plan §Phase 1]
- [ ] CHK005 - Are the pre-population and data-mapping rules specified for intercepting `draft_email` and `draft_calendar_event` into Action Cards? [Completeness, Spec §FR-007]

---

## 2. Requirement Clarity & Precision

- [ ] CHK006 - Is "subtle 1px hairlines" quantified with exact color and opacity values (e.g. `border-white/10`)? [Clarity, Spec §FR-002]
- [ ] CHK007 - Is the smart approval boundary objectively defined between read-only commands and mutating shell operations? [Clarity, Spec §Clarifications Q1]
- [ ] CHK008 - Are the trigger and dismissal criteria for `Ctrl + Space` and `Enter` / `Shift + Enter` explicitly stated without ambiguity? [Clarity, Spec §FR-008]
- [ ] CHK009 - Are the exact SQLite database file location (`~/.config/mavis/mavis.db`) and fallback behavior when the directory does not exist specified? [Clarity, Spec §FR-009]

---

## 3. Requirement Consistency & Alignment

- [ ] CHK010 - Do the Action Card styling requirements (Frosted Acrylic Sheet) align consistently with the unified black background rules? [Consistency, Spec §Clarifications Q3]
- [ ] CHK011 - Does the ReAct state machine in the specification align with the native IPC event contract in `contracts/native-agent-ipc.md`? [Consistency, Spec §State Machine]
- [ ] CHK012 - Are the hotkey interactions (`Ctrl + Space` toggle vs. Enter submit) consistent between the idle notch and the expanded canvas? [Consistency, Spec §FR-008]

---

## 4. Acceptance Criteria & Measurability

- [ ] CHK013 - Can the "zero nested cards" requirement be objectively verified by inspecting the DOM hierarchy? [Measurability, Spec §Success Criteria]
- [ ] CHK014 - Is the multi-turn agent tool execution time target (under 3 seconds) measurable with deterministic automated test scenarios? [Measurability, Spec §Success Criteria]
- [ ] CHK015 - Are success verification steps defined for FTS5 full-text retrieval sub-millisecond query performance? [Acceptance Criteria, Plan §Phase 1]

---

## 5. Scenario & Lifecycle Coverage

- [ ] CHK016 - Are requirements documented for multi-turn tool loops where a tool call fails or returns an error string? [Coverage, Exception Flow]
- [ ] CHK017 - Are requirements specified for when a user denies a mutating shell command in the approval banner? [Coverage, Alternate Flow]
- [ ] CHK018 - Are requirements defined for state continuity and input focus when retracting from an Action Card to the compact notch? [Coverage, State Transition]
- [ ] CHK019 - Are requirements specified for handling network/LLM timeouts during streaming and tool execution? [Coverage, Exception Flow]

---

## 6. Non-Functional & Security Constraints

- [ ] CHK020 - Are the memory footprint ceiling (`< 35MB RAM`) and CPU budget (`< 0.1% CPU`) explicitly validated against Mavis Constitution Principle II? [Non-Functional, Spec §FR-010]
- [ ] CHK021 - Are the privacy safeguards and microphone capture status indicators aligned with Constitution Principle III? [Security, Spec §Constitution Check]
- [ ] CHK022 - Is shell execution sandboxed to prevent unhandled blocking processes from freezing the native Tauri main thread? [Safety, Plan §Phase 1]

---

## 7. Notes & Review Summary

- **Total Checklist Items**: 22 items
- **Review Scope**: Full System (Unified Obsidian Canvas + ReAct Agent Engine + Rust IPC + SQLite FTS5)
- **Reviewer Instructions**: Mark items `[x]` as requirements quality criteria are validated before transitioning to `/speckit-tasks`.
