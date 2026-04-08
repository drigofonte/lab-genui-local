---
date: 2026-04-07
topic: multi-step-generation-pipeline
---

# Interactive Design Agent — Content-First Collaborative UI Generation

## Problem Frame

Two problems compound in the current single-call generation approach:

**1. Structural quality.** After expanding the component catalog from 10 to 18 components, the LLM frequently produces structurally broken specs: orphaned elements, missing children, broken tree shapes. A single call must simultaneously decide content hierarchy, layout composition, and content generation — too many decisions for a local model.

**2. Design alignment.** The user has no input during generation. The LLM guesses what content matters, picks a layout, and fills in values — all in one opaque step. If any assumption is wrong, the user must re-prompt from scratch. Real design is collaborative: designers clarify content requirements, propose structures, and iterate with stakeholders.

The solution is an **interactive design agent** that decomposes generation into three focused phases — content planning, layout, and content population — and collaborates with the user at each phase. The agent follows content-first design practice: content hierarchy informs layout, not the other way around.

```
User: "Show me a capacity dashboard"
         │
         ▼
┌──────────────────────────────────┐
│  Phase 1: Content Plan           │
│                                  │
│  Agent proposes content hierarchy│
│  and asks clarifying questions.  │
│                                  │
│  "I'd suggest showing:           │
│   Primary: 3 KPI metrics         │
│   Secondary: capacity trend      │
│   Tertiary: team allocation      │
│   Q: Monthly or quarterly?"      │
│                                  │
│  Always shown to user.           │
│  User confirms or refines.       │
└──────────────┬───────────────────┘
               │ User confirms/refines
               ▼
┌──────────────────────────────────┐
│  Phase 2: Layout + Components    │
│                                  │
│  Agent builds skeleton spec      │
│  (streamed, progressively        │
│  rendered). User sees layout     │
│  structure appear.               │
│                                  │
│  autoFixSpec → validateSpec.     │
│  If invalid → error-informed     │
│  retry once.                     │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Phase 3: Content Population     │
│                                  │
│  Agent fills in all prop values  │
│  via JSONL patches (streamed).   │
│  Content appears within the      │
│  skeleton layout.                │
└──────────────┬───────────────────┘
               │
               ▼
         Rendered UI
```

## Requirements

**Conversational Orchestration**

- R1. The generation pipeline must be embedded in a multi-turn conversation using assistant-ui. Each pipeline phase is a conversation turn, not a background process.
- R2. The content plan (Phase 1) is always presented to the user as a conversation message. The user confirms, refines, or asks questions before the agent proceeds. For simple requests, the user can confirm immediately; for complex requests, the agent asks targeted clarifying questions. The user is never locked out of the process.

**Phase 1: Content Plan**

- R3. The agent must analyze the user prompt and produce a structured content plan: what entities/data to show, their hierarchy of importance (primary, secondary, tertiary), and what user tasks the UI should support.
- R4. The agent must present the content plan along with targeted clarifying questions to surface unstated assumptions. Questions should be specific and actionable (e.g., "Monthly or quarterly?" not "What time period?").
- R5. The content plan must be specific enough to inform layout decisions — naming concrete data elements (e.g., "3 KPI metrics: headcount, utilization, availability") rather than abstract categories.

**Phase 2: Layout + Component Selection**

- R6. The agent must receive the confirmed content plan and produce a skeleton JSONL spec: a valid renderable tree with all components selected and placed, but content props empty.
- R7. The skeleton spec must stream using the existing JSONL patch format, preserving progressive rendering. Users see the layout structure build visually.
- R8. Skeleton prop format: layout primitives use `null` props. Content components use empty strings for required string props, empty arrays for required array props, `null` for nullable props. The content step patches values only — it never adds or removes elements.

**Structural Validation**

- R9. After the layout phase completes, run `autoFixSpec` to correct common AI generation errors, then `validateSpec` from `@json-render/core` to check structural integrity (missing root, missing children, orphaned elements).
- R10. If validation fails, retry the layout phase once with the validation errors included in the retry prompt (using `formatSpecIssues` from `@json-render/core`). If the error-informed retry also fails, surface the error to the user as a conversation message.

**Phase 3: Content Population**

- R11. The agent must fill in all prop values by emitting JSONL patches (RFC 6902) against the skeleton spec, streamed progressively.
- R12. Patches must be processed by `createSpecStreamCompiler` seeded with the validated skeleton via its `initial` parameter (verified: the compiler accepts optional initial state).
- R13. Invalid patches (targeting nonexistent element keys) must be silently skipped and logged to the debug panel, not crash the generation. The agent should be prompted to only target element keys present in the skeleton.

**Streaming UX**

- R14. Users must see progressive rendering during phases 2 and 3. Phase 1 (content plan) is conversational text. 
- R15. The UI must indicate which phase is active so users understand where they are in the process.

## Success Criteria

- Structural error rate drops significantly compared to single-call generation.
- Layout decisions are informed by content hierarchy — the layout serves the content's relative importance.
- Users can influence generation at the content plan phase rather than only evaluating the final result.
- Progressive streaming UX is preserved throughout.
- Total generation time is acceptable. Three sequential LLM calls will increase wall-clock time compared to a single call; the tradeoff is latency for structural quality and design alignment.

## Scope Boundaries

- **Refinement loop is a follow-up feature.** Iterative refinement (user requests changes to generated output) is a natural next step after the 3-phase pipeline proves the structural quality improvement. It is explicitly out of scope for the initial implementation to avoid bundling two features. The pipeline's architecture (skeleton spec + JSONL patches + `createSpecStreamCompiler` with `initial` state) is designed to support refinement when it's added.
- Few-shot examples for any phase are out of scope (but the pipeline makes them easier to add later).
- Conversation persistence across page refreshes is out of scope (separate feature).
- Changes to the component catalog itself are out of scope.
- Model selection or fine-tuning is out of scope.
- Data source integration (connecting to real databases/APIs) is out of scope.

## Key Decisions

- **Interactive pipeline, not automated**: Each pipeline phase is a conversation turn. The agent collaborates with the user rather than running autonomously. This follows how real design works: designers clarify requirements, propose structures, and iterate.
- **Content-first pipeline order**: Following established design practice, the pipeline determines content hierarchy before layout. This prevents the LLM from selecting arbitrary layouts that content must contort to fit.
- **Always show content plan**: Rather than the agent judging when to pause vs. proceed (which requires an unresolved classification mechanism), the content plan is always presented. The user confirms immediately for simple requests or refines for complex ones. This eliminates the classification problem while preserving user agency.
- **Refinement loop deferred**: The initial implementation covers the 3-phase pipeline only. Refinement (R14-R15 from the prior iteration) is a separate feature that builds on validated pipeline infrastructure. This keeps the scope focused on proving the structural quality improvement.
- **Error-informed retry**: Validation failures include the specific errors in the retry prompt (via `formatSpecIssues`), giving the LLM concrete feedback rather than blindly retrying with the same input at low temperature.
- **Assistant-ui as the interaction surface**: The multi-turn conversation UI is the pipeline's interaction surface. Each pipeline phase maps to conversation turns.
- **Skeleton spec as intermediate format**: The layout phase produces a real, renderable JSONL spec. This preserves streaming UX and validates structure concretely.
- **Full skeleton with empty props**: Content components use empty strings/arrays for required props. The content step only patches values — no structural changes.
- **JSONL patches for content**: The content step uses the same RFC 6902 patch format as today, via `createSpecStreamCompiler` with initial state.

## Dependencies / Assumptions

- **Verified:** `createSpecStreamCompiler` accepts an optional `initial` parameter, confirming the content step can build on the skeleton spec.
- **Verified:** `validateSpec`, `autoFixSpec`, and `formatSpecIssues` exist in `@json-render/core` with the structural checks and error formatting needed for R9-R10.
- **Verified:** `buildUserPrompt` from `@json-render/core` supports a `currentSpec` parameter, potentially usable for the content step's prompt.
- **Prerequisite:** assistant-ui must be integrated before this pipeline can be interactive. Specifically, the UX overhaul's Unit 4 (`ChatModelAdapter` wiring Ollama to assistant-ui's runtime) and Unit 5 (app shell with Thread component) must be complete. Units 6-7 (diagnostics panel, responsive layout) are not prerequisites. See `docs/brainstorms/2026-04-05-ux-overhaul-requirements.md` and `docs/plans/2026-04-05-003-feat-ux-overhaul-every-layout-plan.md`.
- assistant-ui can render arbitrary React components in assistant messages (for showing the skeleton and populated spec inline in the conversation).
- Three sequential LLM calls will increase total generation time. With a local model, expect roughly 2-3x the wall-clock time of a single call. The content plan phase (Phase 1) should be fast since it produces only text, not JSONL.

## Outstanding Questions

### Resolve Before Planning

(None — all product decisions are resolved.)

### Deferred to Planning

- [Affects R3][Needs research] What format should the content plan use? Options: structured markdown, JSON with hierarchy levels, or free-form text. Note: `catalog.prompt()` supports `mode: "inline"` which allows conversational text before JSONL — this could serve Phase 1. The format directly affects Phase 2 prompt design.
- [Affects R6][Technical] Should the layout prompt include the full component catalog or a subset? `catalog.prompt()` currently emits the full catalog with no subsetting mechanism. For Phase 3, sending only the components present in the skeleton would reduce hallucination risk.
- [Affects R11][Technical] How should the content step's prompt be structured? `buildUserPrompt` from `@json-render/core` supports a `currentSpec` parameter that may be directly usable.
- [Affects R15][Technical] How should the UI communicate the active pipeline phase? The existing `StreamPhase` type could be extended to `"planning" | "generating-layout" | "generating-content"`.
- [Affects R1][Needs research] What orchestration approach for the conversational pipeline? Options: plain state machine (simplest), async generator pipeline, or lightweight agent framework. Without the refinement loop, a state machine may suffice.
- [Affects R1][Needs research] How does assistant-ui's runtime wire up with a custom LLM backend (Ollama)? The UX overhaul plan (Unit 4) addresses this — verify it's resolved before planning this feature.

## Next Steps

-> Complete the assistant-ui integration (UX overhaul Units 4-5) as the prerequisite
-> Then `/ce:plan` for structured implementation planning of the interactive pipeline
