---
date: 2026-04-05
topic: genui-improvements
focus: open-ended improvements after spike validation
---

# Ideation: GenUI Local Improvements

## Codebase Context

React 19 + TypeScript + Vite SPA that generates UI from natural language prompts using a local Ollama LLM. Progressive rendering via JSONL patches (json-render's `createSpecStreamCompiler`). 10-component catalog (Card, Metric, Table, Text, Heading, Stack, Grid, Badge, BarGraph, Separator). Custom `SimpleRenderer` bypasses json-render's `createRenderer` due to prop-passing incompatibility with shadcn components. Debug panel shows live JSONL patches, thinking output, errors, and system prompt. Hardcoded sample sales data. No persistence, no conversation memory, no user data import.

## Ranked Ideas

### 1. Catalog-Driven Few-Shot Examples
**Description:** Inject 2-3 complete worked spec examples into the system prompt, auto-assembled from the catalog's existing `example` fields. Zero new content needed — the examples already exist in `catalog.ts`.
**Rationale:** Highest-ROI prompt engineering intervention. For 7-8B models, 0-shot → 2-shot structured output compliance can jump from ~40% to ~85%. Every other idea depends on reliable generation.
**Downsides:** Adds ~500-800 tokens to system prompt, reducing headroom for user data context.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 2. UX Polish: Layout Stability and Visual Hierarchy
**Description:** Fix layout shift from status messages (reserve space or use overlay). Stack rendered output above diagnostics instead of side-by-side. Center content. Make diagnostics collapsible/hidden by default with a toggle.
**Rationale:** Current 2-column layout squashes both panels. Stacking vertically with diagnostics collapsed makes the rendered output the hero. Layout shifts from "Connecting..."/"Thinking..." break visual flow.
**Downsides:** None meaningful.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 3. UX Polish: Sticky Tabs and Auto-scroll
**Description:** Debug panel tabs auto-scroll to bottom as content streams. Thinking tab persists after generation (not disappearing). Tabs remember selection.
**Rationale:** During streaming, the interesting content is at the bottom. The disappearing Thinking tab is disorienting.
**Downsides:** Auto-scroll needs "user is manually scrolling" detection.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 4. Spec Editor — Editable Debug JSON with Live Re-render
**Description:** Make the debug panel's Raw JSON tab editable. On valid parse + catalog validation, update the rendered spec live. No LLM call needed.
**Rationale:** ~40 lines of code. Immediately useful for understanding component behavior, debugging LLM output, and manual spec authoring.
**Downsides:** Raw JSON editing is developer-only UX.
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

### 5. Config Panel — Model Selector + num_predict
**Description:** Settings drawer with Ollama model dropdown (auto-discovered via `/api/tags`) and num_predict slider. Persisted to localStorage.
**Rationale:** Switching models is the most common lab action. Currently requires editing TypeScript source.
**Downsides:** Minor scope — skip the Ollama URL field.
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

### 6. Prompt History with UI Snapshots
**Description:** Persist every successful spec to IndexedDB with prompt and timestamp. Collapsible sidebar of past generations — click to restore instantly.
**Rationale:** Zero persistence is the single biggest trust gap. Can't compare outputs, build on previous work, or survive a page refresh.
**Downsides:** IndexedDB API is verbose. Storage management needs thought.
**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

### 7. Export to React Code
**Description:** Convert spec JSON to a self-contained React + Tailwind `.tsx` file. One-click copy or download. Deterministic — no LLM involved.
**Rationale:** Answers "now what?" after generation. Transforms the tool from a visualization demo into a scaffolding tool.
**Downsides:** Generated code quality depends on component mapping fidelity.
**Confidence:** 75%
**Complexity:** Medium
**Status:** Unexplored

### 8. Google Sheets Integration — Bring Your Own Data via URL
**Description:** User pastes a Google Sheets published CSV link. App fetches and parses it, injects schema + sample rows into prompt context.
**Rationale:** Google Sheets is the default "database" for solopreneurs and team leads. Published sheets expose a CSV endpoint with zero auth.
**Downsides:** Requires sheet to be published. Private sheets need OAuth (out of scope). CORS may need a proxy.
**Confidence:** 70%
**Complexity:** Medium
**Status:** Unexplored

### 9. DuckDB Data Import + Tool Calling (two phases)
**Description:** Phase 1: Drag-and-drop CSV/JSON → DuckDB-WASM profiles it → schema summary replaces hardcoded data. Phase 2: LLM issues SQL queries via Ollama tool calling → DuckDB executes in-browser → results populate spec.
**Rationale:** The architecturally distinctive bet. No hosted tool replicates local data + local LLM + local query engine + generated UI.
**Downsides:** Phase 2 is complex (tool-calling format + dispatch loop). Build sequentially.
**Confidence:** 70%
**Complexity:** Medium (Phase 1) / High (Phase 2)
**Status:** Unexplored

### 10. Conversational Refinement with Spec Diffing
**Description:** Pass message history across generations for follow-ups like "add a trend line." Diff old vs new spec to show what changed. Surface model reasoning inline.
**Rationale:** Uses the model's stronger instruction-following (short deltas) rather than weaker compositional planning (full dashboards from scratch).
**Downsides:** Context window pressure. Small models may lose coherence after 3-4 turns.
**Confidence:** 70%
**Complexity:** High
**Status:** Unexplored

### 11. Every Layout Primitives — Intrinsic, Composable Layout System
**Description:** Replace the current Stack/Grid layout components with Heydon Pickering's Every Layout primitives: Stack, Box, Center, Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel. These are intrinsically responsive — they adapt to available space algorithmically using CSS custom properties, without breakpoints or explicit column counts. The LLM composes layouts by nesting primitives (e.g., a Cover containing a Stack of Clusters) instead of specifying pixel values or column numbers.
**Rationale:** This is a perfect fit for LLM-generated UI. Current layout components force the model to make decisions it's bad at (how many columns? what gap size? what breakpoint?). Every Layout primitives are self-sizing — the LLM just says "put these in a Sidebar" and the CSS handles the responsive behavior. Fewer layout decisions = fewer failure modes = higher generation reliability. The primitives are also a strict superset of what we have (Stack and Grid already exist in the catalog) — we'd be adding Center, Cluster, Sidebar, Switcher, Cover, Frame, and Reel as new layout options. This compounds with the few-shot examples idea (#1): a richer layout vocabulary means richer example specs.
**Downsides:** Requires implementing ~8 new layout components (CSS-only, no complex logic). The LLM needs to learn when to use Sidebar vs Switcher vs Cluster — the system prompt grows. Some primitives (Frame, Reel, Imposter) may not be useful for dashboard-style UIs.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | CSV/JSON drag-and-drop (simple) | Merged into DuckDB idea — DuckDB is the better version |
| 2 | Inline component editing | No reliable path from rendered DOM to spec key; LLM can't do surgical edits |
| 3 | Conversation thread (standalone) | Absorbed into conversational refinement — multi-turn is delivery mechanism, not the idea |
| 4 | Confidence indicators | Parsing unstructured thinking for hedging words is regex theater |
| 5 | Prompt templates | A dropdown of strings; no learning, no infrastructure |
| 6 | json-render state model | Needs interactive components that don't exist in catalog yet |
| 7 | Inline mode (standalone) | Absorbed into conversational refinement — visible reasoning only matters in refinement context |
| 8 | WebLLM in-browser | Deployment concern, not lab concern; week of work for inferior inference |
| 9 | Pinned UI slots | Overlap with prompt history; pinning is a one-line addition on top |
| 10 | Catalog-as-Code | Already essentially unified; DX refactor, not capability |
| 11 | Prompt fingerprinting | Ollama KV cache is server-controlled; no client-side handle |
| 12 | Standalone renderer widget | Productization concern; no second consumer asking for it |
| 13 | Streaming rollback log | Niche debugging; rawLines display covers 90% of use case |
| 14 | LLM as combinator | Three unsolved sub-problems; needs 20+ stable snippets first |
| 15 | Shareable spec URLs | Requires server or ugly URL encoding; no sharing infra in local lab |
| 16 | LLM-defined components | Fascinating but requires runtime component registration + meta-schema; research project |

## Ideas Added to Vision (not duplicated here)

The following ideas were captured directly in the product vision doc (`docs/vision/2026-04-05-product-vision.md`) rather than the ideation list, as they are product-level decisions rather than incremental improvements:

- **Target use case: People capacity management** (inspired by Runn.io)
- **Framework adoption: React Router + TanStack Query + Radix**
- **Atomic design system with LLM composition guidelines**
- **Storybook integration for component discovery**
- **Pinned views with "set as home" capability**
- **Data sync / zero-copy patterns**
- **Memory system: session capture → daily consolidation → long-term context**
- **Platform vision: self-service app hosting, sharing, micro-economy**

## Session Log
- 2026-04-05: Initial ideation — 32 raw candidates generated across 4 frames (user pain, missing capabilities, leverage/compounding, inversion/reframing), 22 after dedupe, 10 survivors after adversarial filtering. User added 3 UX polish ideas and Google Sheets integration.
- 2026-04-05: Refinement — User suggested Every Layout primitives (Heydon Pickering). Researched and added as idea #11. Total survivors: 11.
- 2026-04-05: Vision expansion — User described target use case (capacity management), framework preferences (React Router, TanStack, Radix), atomic design, memory system, data sync, and platform vision. Captured in `docs/vision/2026-04-05-product-vision.md` as product-level decisions.
