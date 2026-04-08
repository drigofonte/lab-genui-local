---
date: 2026-04-08
source: ce:review of feat/assistant-ui-integration
---

# Technical Debt: assistant-ui Integration

Items identified during code review that are non-blocking for the lab project but should be addressed before production use.

## P1 — High

### Unsafe `as unknown as` cast hides missing `argsText` field
- **File:** `src/chat/ollama-runtime.tsx` (buildResult function)
- **Issue:** `ToolCallMessagePart` requires `argsText: string` but the constructed parts omit it. The cast masks the type gap. Works at runtime because assistant-ui tolerates it, but could break on library updates.
- **Fix:** Add `argsText: JSON.stringify({ spec })` to the tool-call part, or investigate whether assistant-ui actually requires this field.

### Overlapping generations corrupt diagnostics state
- **File:** `src/chat/ollama-runtime.tsx`, `src/chat/diagnostics-context.tsx`
- **Issue:** No mutual exclusion — if a user submits a new prompt while a previous generation is still streaming, both async generators call `setState()` on the same diagnostics store concurrently. Thinking content, rawLines, and isGenerating can interleave.
- **Fix:** Abort the previous generation's AbortController before starting a new one, or tag diagnostics updates with a generation ID so stale updates are ignored.

## P2 — Moderate

### No timeout on fetch to Ollama
- **File:** `src/chat/ollama-runtime.tsx:58`
- **Issue:** The fetch call has no timeout. If Ollama hangs or is partially responsive, the client waits indefinitely. The abort signal is user-triggered only.
- **Fix:** Use `AbortSignal.any([abortSignal, AbortSignal.timeout(120000)])` or create a manual timeout controller.

### Stale spec persists after failed generation
- **File:** `src/App.tsx`
- **Issue:** If generation B fails (error, empty response), `handleSpecUpdate` is never called, so the center panel keeps displaying generation A's spec. The user sees a stale UI alongside an error in diagnostics.
- **Fix:** Clear spec state (`setSpec(null)`) when a new generation starts. Could be done via a diagnostics callback or by listening to thread state changes.

### Missing edge-case test coverage
- **File:** `src/chat/__tests__/ollama-runtime.test.ts`
- **Issue:** Several adapter code paths are untested: response with no body stream, malformed JSON in stream, missing `message` field in chunks, abort during reader.read() loop (vs. pre-fetch abort), non-AbortError exceptions during streaming.
- **Fix:** Add targeted tests for each branch.

### Provider wrapping duplicated in mobile/desktop
- **File:** `src/App.tsx`
- **Issue:** `OllamaRuntimeProvider`, `TooltipProvider`, and `RenderUIToolUI` are duplicated in both the mobile and desktop render branches. Future provider changes require edits in two places.
- **Fix:** Extract shared provider wrapper, only branch on the interior layout.

## P3 — Low

### `reset()` on DiagnosticsContext is dead code
- **File:** `src/chat/diagnostics-context.tsx`
- **Issue:** The store defines `reset()` but it's never called. Fields are reset manually via partial `setState` in the adapter. If new fields are added, they won't be reset.

### Factory/wrapper abstractions with single callers
- **Files:** `src/chat/ollama-runtime.tsx`, `src/chat/tool-ui.tsx`
- **Issue:** `createOllamaAdapter`, `OllamaRuntimeInner`, and `createRenderUIToolUI` are factory/wrapper patterns with exactly one caller each. They add indirection without enabling actual variation.

### Missing tests for UI components
- **Files:** `src/components/MobileTabBar.tsx`, `src/hooks/useMediaQuery.ts`, `src/chat/tool-ui.tsx`
- **Issue:** No unit tests for the mobile tab bar, media query hook, or tool UI rendering branches.

## Agent-Native Gaps (future work)

No programmatic API exists to send prompts or read specs outside the React component tree. For agent integration, would need:
- `sendMessage(text: string): Promise<AppSpec>` function
- `getLastSpec(): AppSpec | null` getter
- `getDiagnostics(): DiagnosticsState` query
- Abort/cancellation API for agent-driven workflows
