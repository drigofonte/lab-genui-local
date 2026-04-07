---
title: "feat: Debug panel UX polish — auto-scroll, sticky tabs, persistent thinking"
type: feat
status: active
date: 2026-04-07
origin: docs/brainstorms/2026-04-07-debug-panel-ux-polish-requirements.md
---

# feat: Debug panel UX polish

## Overview

Fix three UX friction points in the debug panel during streaming generation: add auto-scroll that follows new content, persist the Thinking tab after generation completes, and maintain tab selection across re-renders and generations.

## Problem Frame

The debug panel (`src/components/DebugPanel.tsx`) uses uncontrolled tabs with no scroll management. During streaming, the user must manually scroll to see new content, the Thinking tab can disappear, and tab selection resets. (see origin: `docs/brainstorms/2026-04-07-debug-panel-ux-polish-requirements.md`)

## Requirements Trace

- R1. JSONL tab auto-scrolls to bottom during streaming
- R2. Thinking tab auto-scrolls to bottom as content grows
- R3. Auto-scroll pauses when user scrolls up
- R4. Auto-scroll resumes when user scrolls back to bottom
- R5. Thinking tab remains visible after generation completes
- R6. Thinking tab only hides when no thinking content has ever existed in the session
- R7. Tab selection persists across re-renders during streaming
- R8. Tab selection persists across generations within the session

## Scope Boundaries

- Session-only state — no localStorage persistence
- No layout, sizing, or visual design changes
- No streaming adapter changes
- No auto-scroll on Errors tab

## Context & Research

### Relevant Code and Patterns

- `src/components/DebugPanel.tsx` — single component, 96 lines, 4 tabs (JSON, Thinking, Errors, System Prompt)
- `src/components/ui/tabs.tsx` — wrapper around `@base-ui/react/tabs`, supports `value` + `onValueChange` for controlled mode
- `src/App.tsx:74-80` — passes `progress?.thinkingContent ?? null` as prop; resets to null between generations

### Institutional Learnings

- No prior solutions related to scroll management or tab state in this project.

## Key Technical Decisions

- **Scroll detection via scrollTop arithmetic**: Use `scrollHeight - scrollTop - clientHeight < threshold` in a scroll event handler. Simpler than IntersectionObserver for a single `<pre>` element, no setup/teardown overhead.

- **"Has ever had thinking" tracking**: Add a `hasEverHadThinking` state flag inside DebugPanel. Set it to `true` whenever `thinkingContent` is non-empty (via a `useEffect`). Never reset it during the session. This keeps the Thinking tab visible after generation without lifting state into App.tsx.

- **Controlled tabs via `value` + `onValueChange`**: Replace `defaultValue="json"` with `useState("json")` + `value`/`onValueChange`. This is the standard base-ui pattern and ensures tab selection survives re-renders.

## Open Questions

### Resolved During Planning

- **Scroll detection approach** — `scrollTop + clientHeight` arithmetic is sufficient for single scrollable containers. IntersectionObserver is overkill here.
- **Thinking state location** — Keep it inside DebugPanel as local state. No need to lift to App.tsx since the panel is the only consumer.

## Implementation Units

- [ ] **Unit 1: Controlled tab state**

  **Goal:** Replace uncontrolled tabs with React state so selection persists across re-renders and generations.

  **Requirements:** R7, R8

  **Dependencies:** None

  **Files:**
  - Modify: `src/components/DebugPanel.tsx`
  - Test: `src/components/__tests__/DebugPanel.test.tsx`

  **Approach:**
  - Add `useState<string>("json")` for active tab
  - Replace `defaultValue="json"` with `value={activeTab}` and `onValueChange={(val) => setActiveTab(val)}`
  - Tab selection now survives re-renders and persists across generations since the state lives in the component

  **Patterns to follow:**
  - base-ui controlled tabs pattern: `value` + `onValueChange` props on `TabsPrimitive.Root`

  **Test scenarios:**
  - Happy path: Selecting "errors" tab and triggering a re-render preserves the "errors" selection
  - Happy path: Tab starts on "json" by default

  **Verification:**
  - Switching tabs during streaming stays on the selected tab
  - Starting a new generation does not reset tab selection

- [ ] **Unit 2: Persistent Thinking tab**

  **Goal:** Keep the Thinking tab visible after generation completes, even when `thinkingContent` prop becomes null.

  **Requirements:** R5, R6

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `src/components/DebugPanel.tsx`
  - Test: `src/components/__tests__/DebugPanel.test.tsx`

  **Approach:**
  - Add `hasEverHadThinking` state, initialized to `false`
  - Add a `useEffect` watching `thinkingContent`: when non-empty, set `hasEverHadThinking` to `true`
  - Replace the tab visibility condition: show the Thinking tab when `hasEverHadThinking` is true (not just when current `thinkingContent` is non-empty)
  - Show the tab content: display `thinkingContent` when available, or a "No thinking output for this generation" message when the tab is visible but content is null
  - Keep `thinkingContent` display for the tab content panel — it shows current content when streaming and last content when idle

  **Test scenarios:**
  - Happy path: Thinking tab appears when `thinkingContent` becomes non-empty
  - Happy path: Thinking tab stays visible after `thinkingContent` resets to null
  - Edge case: Thinking tab is hidden when no thinking content has ever been provided
  - Edge case: Starting a new generation with thinking content after one without — tab reappears

  **Verification:**
  - After a generation with thinking output, the Thinking tab remains accessible even when props reset

- [ ] **Unit 3: Auto-scroll with manual override**

  **Goal:** Auto-scroll the JSONL and Thinking tab content to the bottom as new content streams in, pausing when the user scrolls up.

  **Requirements:** R1, R2, R3, R4

  **Dependencies:** Units 1, 2

  **Files:**
  - Create: `src/hooks/useAutoScroll.ts`
  - Modify: `src/components/DebugPanel.tsx`
  - Test: `src/components/__tests__/DebugPanel.test.tsx`

  **Approach:**
  - Extract a `useAutoScroll(ref, content)` hook that:
    - Tracks whether the user is "at the bottom" via a `userIsAtBottom` ref (default: `true`)
    - On scroll events: update `userIsAtBottom` based on `scrollHeight - scrollTop - clientHeight < THRESHOLD` (threshold ~30px)
    - On content change (via `useEffect` on `content`): if `userIsAtBottom` is true, call `ref.current.scrollTop = ref.current.scrollHeight`
  - Attach a `ref` to the `<pre>` elements in the JSONL and Thinking tabs
  - Call `useAutoScroll(jsonRef, jsonDisplay)` and `useAutoScroll(thinkingRef, thinkingContent)`
  - Use `useRef` for the `userIsAtBottom` flag (not state) to avoid unnecessary re-renders on scroll

  **Patterns to follow:**
  - Standard React scroll pattern: `useRef` for DOM element + `useEffect` for scroll-on-update

  **Test scenarios:**
  - Happy path: Content update scrolls the container to the bottom when user hasn't scrolled up
  - Happy path: Auto-scroll applies to both JSONL and Thinking tabs independently
  - Edge case: User scrolls up — subsequent content updates do not scroll
  - Edge case: User scrolls back to bottom — auto-scroll resumes
  - Edge case: Empty content does not cause errors

  **Verification:**
  - During streaming, the JSONL tab follows new content without user intervention
  - Scrolling up to read earlier content pauses auto-scroll
  - Scrolling back to bottom resumes auto-scroll

## System-Wide Impact

- **Interaction graph:** Changes are isolated to `DebugPanel.tsx` and a new hook. No callbacks, middleware, or cross-component effects.
- **Unchanged invariants:** Streaming adapter, App.tsx prop passing, and all other components are untouched.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Scroll event handler performance during rapid streaming | Use passive scroll listener; `userIsAtBottom` is a ref, not state, so no re-renders on scroll |
| base-ui Tabs controlled mode behaves differently than expected | Verified: `TabsPrimitive.Root` accepts `value` + `onValueChange` in the type definitions |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-07-debug-panel-ux-polish-requirements.md](docs/brainstorms/2026-04-07-debug-panel-ux-polish-requirements.md)
- Related code: `src/components/DebugPanel.tsx`, `src/components/ui/tabs.tsx`
