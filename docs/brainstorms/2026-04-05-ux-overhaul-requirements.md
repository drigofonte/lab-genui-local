---
date: 2026-04-05
topic: ux-overhaul
---

# UX Overhaul: Conversation-First Layout with assistant-ui

## Problem Frame

The spike's UI is a developer prototype: a textarea at the top, a squashed 2-column layout (rendered output | debug panel), and no conversation history. This creates several UX problems:

- **Layout shift**: Status messages ("Connecting...", "Thinking...") push content down
- **Wasted space**: The 2-column layout squashes both panels on typical screens
- **No conversation flow**: Each generation is a cold start — no way to iterate or see history
- **Diagnostics dominate**: The debug panel is always visible and takes 50% of the screen, even though most users care about the rendered output
- **Disappearing state**: The Thinking tab appears during generation then vanishes — disorienting
- **No auto-scroll**: During streaming, the user must manually scroll to see the latest content
- **Not responsive**: The side-by-side layout breaks on smaller screens

Competitive tools (Lovable, v0, Replit) all use a conversation-first layout where the chat thread is the primary interaction surface and the generated output is a live preview. This is the established pattern for AI generation tools.

```
┌──────────┬──────────────────────────────┬──────────────┐
│  Left    │     Center: Rendered UI      │   Right:     │
│  Sidebar │     (generated output)       │   Chat       │
│          │     Full width, hero area    │   Thread     │
│  (future:│                              │   (assistant-│
│  saved   │                              │    ui)       │
│  views,  ├──────────────────────────────┤              │
│  data,   │  Bottom: Diagnostics panel   │              │
│  config) │  (collapsible, like VS Code) │              │
└──────────┴──────────────────────────────┴──────────────┘

Mobile: stacked with tab switcher (Chat | Preview)
```

## Requirements

**Layout Structure**

- R1. VS Code-inspired 3-panel layout: left sidebar (collapsible, placeholder for future features), center content area (rendered UI + diagnostics), right panel (chat thread)
- R2. Center area splits vertically: rendered UI on top (hero, takes most space), diagnostics panel on bottom (collapsible, hidden by default, pull-up like VS Code terminal)
- R3. Responsive: on screens below ~1024px, collapse to a tabbed layout — Chat and Preview tabs. Diagnostics accessible via a toggle within the Preview tab
- R4. Left sidebar is a collapsible icon rail for now (empty or with placeholder icons). It exists in the layout to avoid a future restructure when saved views, data sources, and config are added

**Chat Thread (assistant-ui)**

- R5. Integrate assistant-ui's Thread component as the right panel. User messages show the prompt text. Assistant messages show a summary of what was generated (e.g., "Generated a dashboard with 4 metrics and a bar chart") with the rendered UI visible in the center panel
- R6. The chat thread supports multi-turn conversation: each new prompt is appended to the thread, not a replacement. The thread persists during the session (lost on refresh — persistence is a separate feature)
- R7. The Composer (input area) is anchored at the bottom of the chat panel with a send button. Supports Enter to send, Shift+Enter for newline
- R8. During generation, the assistant message shows streaming status: "Thinking..." → "Generating UI..." with the same phase indicators as today, but rendered within the message bubble instead of above the prompt input

**Diagnostics Panel**

- R9. Diagnostics panel is hidden by default. A toggle button (or drag handle) at the bottom of the center area reveals it. Behaves like VS Code's terminal panel — resizable, collapsible
- R10. Tabs within diagnostics: Raw JSON (or JSONL Patches during streaming), Thinking, Errors, System Prompt. All tabs persist after generation completes — the Thinking tab does not disappear
- R11. Auto-scroll: all diagnostic tabs auto-scroll to the bottom as content streams in. If the user scrolls up manually, auto-scroll pauses. Scrolling back to the bottom re-enables it

**Layout Stability**

- R12. No layout shift from status messages or phase changes. Status indicators render within fixed-height areas (chat message bubbles) rather than inserting new elements that push content down
- R13. The rendered UI area maintains its position and size during generation — components appear progressively within a stable container

## Success Criteria

- The rendered UI occupies the largest visual area and is the first thing a user sees
- A user can type a prompt, see the UI generate, then type a follow-up to refine — all within a persistent thread
- Diagnostics are accessible but not in the way — a developer can toggle them on, a non-developer never sees them
- The layout works on a 13" laptop without horizontal scrolling or cramped panels
- On mobile, the user can switch between chat and preview without losing context
- No layout shift during any phase of generation

## Scope Boundaries

- Left sidebar content (saved views, data sources, model config) is out of scope — only the structural placeholder
- Conversation persistence across page refreshes is out of scope (separate feature)
- Multi-turn refinement logic in the adapter (passing message history to Ollama) is out of scope — this brainstorm covers the UI shell only. The adapter still generates independently per prompt; wiring multi-turn is a follow-up
- assistant-ui backend/runtime integration details are deferred to planning
- No changes to the component catalog, SimpleRenderer, or adapter logic

## Key Decisions

- **Conversation-first layout**: Chat thread is the primary interaction surface, generated UI is a live preview. Matches the established pattern across Lovable, v0, and Replit.
- **assistant-ui for the chat thread**: Provides Thread, Composer, Message primitives with streaming support out of the box. Avoids building chat UI from scratch. Generative UI rendering (specs as tool results) fits assistant-ui's tool rendering pattern.
- **VS Code-style panel arrangement**: Users already understand this layout. Left sidebar scales to accommodate future features (saved views, data, config) without restructuring.
- **Diagnostics hidden by default**: Flips the current design where debug info takes 50% of the screen. Most users never need it; developers can toggle it on.

## Dependencies / Assumptions

- assistant-ui is compatible with Vite + React 19 (needs verification during planning)
- assistant-ui can be used with a custom backend (Ollama via our adapter) rather than requiring Vercel AI SDK
- The Thread component can render custom content in assistant messages (our rendered specs)

## Outstanding Questions

### Deferred to Planning

- [Affects R5][Needs research] How does assistant-ui's runtime system work with a custom LLM backend? We need to wire our `generateUI` adapter into assistant-ui's runtime instead of using their built-in Vercel AI SDK integration
- [Affects R5][Needs research] Can assistant-ui messages render arbitrary React components (our SimpleRenderer output) as "tool UI"? Or do we need to use their generative UI pattern differently?
- [Affects R3][Technical] What is the best responsive breakpoint strategy for the 3-panel → tabbed transition? Should we use CSS container queries or media queries?
- [Affects R9][Technical] How to implement the VS Code-style resizable diagnostics panel — is there a lightweight library, or hand-roll with CSS resize/drag?
- [Affects R4][Technical] Should the left sidebar use a specific component (Radix NavigationMenu, shadcn sidebar) or a plain collapsible div for the placeholder?

## Next Steps

→ `/ce:plan` for structured implementation planning
