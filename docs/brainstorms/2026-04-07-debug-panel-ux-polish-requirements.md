---
date: 2026-04-07
topic: debug-panel-ux-polish
---

# Debug Panel UX Polish: Sticky Tabs, Auto-scroll, Persistent Thinking

## Problem Frame

The debug panel (`src/components/DebugPanel.tsx`) has three UX friction points during streaming generation:

1. **No auto-scroll** — As JSONL patches and thinking content stream in, the `<pre>` elements don't scroll to the bottom. The interesting content is always at the bottom, but the user must manually scroll to follow it.
2. **Thinking tab disappears** — The Thinking tab is conditionally rendered (`hasThinking && ...`). If the user switches away from it and the content reference changes, the tab vanishes. Users lose access to the model's reasoning after generation completes if the state resets.
3. **Tab selection resets** — The tab component uses `defaultValue="json"` with no controlled state. Re-renders during streaming can reset the active tab, and the selection doesn't persist across generations.

## Requirements

**Auto-scroll**

- R1. The JSONL Patches / Raw JSON tab auto-scrolls to the bottom as new lines arrive during streaming
- R2. The Thinking tab auto-scrolls to the bottom as thinking content grows
- R3. Auto-scroll pauses when the user manually scrolls up (they're reading earlier content)
- R4. Auto-scroll resumes when the user scrolls back to the bottom (within a small threshold)

**Thinking Tab Persistence**

- R5. The Thinking tab remains visible after generation completes, even if the user navigated away from it during streaming
- R6. The Thinking tab only hides when there has never been thinking content in the current session (i.e., the model doesn't support thinking output)

**Tab Selection Memory**

- R7. The active tab selection persists across re-renders during streaming
- R8. The active tab selection persists across generations within the same session

## Scope Boundaries

- No localStorage persistence of tab selection across page reloads — session-only via React state
- No changes to the debug panel layout, sizing, or visual design
- No changes to the streaming adapter or data flow
- The Errors tab auto-scroll is not required (errors are typically short)

## Success Criteria

- During streaming, the JSONL tab stays scrolled to the latest content without user intervention
- The Thinking tab is always accessible after a generation that included thinking content
- Switching tabs during streaming and back works without losing scroll position or tab state

## Key Decisions

- **Session state, not localStorage**: Tab selection is React state (`useState`), not persisted to localStorage. The panel always starts on the JSONL tab on page load — this is the right default.
- **Scroll threshold**: Use a small pixel threshold (~30px) to detect "user is at the bottom" for auto-scroll resume. Exact value is a planning/implementation detail.

## Outstanding Questions

### Deferred to Planning

- [Affects R3, R4][Technical] Best approach for scroll detection — `IntersectionObserver` on a sentinel element vs `scrollTop + clientHeight` check in a scroll event handler
- [Affects R5][Technical] Whether to lift thinking content state into DebugPanel or keep it prop-driven and track "has ever had thinking" separately

## Next Steps

→ `/ce:plan` for structured implementation planning
