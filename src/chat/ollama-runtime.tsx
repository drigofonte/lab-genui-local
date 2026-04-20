import { type ReactNode, useMemo } from "react";
import {
  useLocalRuntime,
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  type ChatModelRunOptions,
  type ChatModelRunResult,
} from "@assistant-ui/react";
import {
  createSpecStreamCompiler,
  validateSpec,
  autoFixSpec,
  formatSpecIssues,
  buildUserPrompt,
  type Spec,
} from "@json-render/core";
import { catalog, type AppSpec } from "@/catalog/catalog";
import { MODEL_NAME, OLLAMA_BASE_URL, NUM_PREDICT } from "@/adapter/config";
import {
  DiagnosticsProvider,
  useDiagnosticsDispatch,
  type DiagnosticsState,
} from "./diagnostics-context";

const TOOL_CALL_ID = "render_ui";

type DiagnosticsCallback = (partial: Partial<DiagnosticsState>) => void;

// ---------------------------------------------------------------------------
// Phase detection
// ---------------------------------------------------------------------------

type PipelinePhase = "content-plan" | "layout" | "content-population";

/**
 * Inspect the message history to determine which pipeline phase to run.
 *
 * - No prior assistant messages with tool-call → Phase 1 (content plan)
 * - Prior assistant text (content plan) + user confirmation → Phase 2+3 (layout + content)
 */
function detectPhase(
  messages: ChatModelRunOptions["messages"],
): { phase: PipelinePhase; contentPlan: string | null } {
  // Find the last assistant message
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  // Check if any assistant message contains a tool-call (meaning a spec was already generated)
  const hasToolCall = assistantMessages.some((m) =>
    m.content.some((p) => p.type === "tool-call"),
  );

  if (hasToolCall) {
    // A spec already exists — this shouldn't happen since refinement is out of scope
    // Fall through to content-plan for a fresh generation
    return { phase: "content-plan", contentPlan: null };
  }

  // Check if there's a text-only assistant message (content plan)
  const contentPlanMessage = assistantMessages.findLast((m) =>
    m.content.some((p) => p.type === "text" && p.text.length > 20),
  );

  if (contentPlanMessage) {
    // Content plan exists and user has sent a confirmation — proceed to layout
    const planText = contentPlanMessage.content
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");

    return { phase: "layout", contentPlan: planText };
  }

  // No prior assistant messages — start fresh with content plan
  return { phase: "content-plan", contentPlan: null };
}

// ---------------------------------------------------------------------------
// Shared Ollama streaming helper
// ---------------------------------------------------------------------------

interface StreamResult {
  thinkingContent: string;
  rawContent: string;
  spec: AppSpec | null;
  rawLines: string[];
}

async function* streamFromOllama(
  systemPrompt: string,
  userMessage: string,
  abortSignal: AbortSignal,
  onDiagnostics: DiagnosticsCallback | undefined,
  initialSpec?: AppSpec,
): AsyncGenerator<
  { type: "progress"; result: StreamResult } | { type: "error"; message: string },
  StreamResult | null
> {
  let response: Response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
        options: {
          num_predict: NUM_PREDICT,
          temperature: 0.1,
        },
      }),
      signal: abortSignal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return null;
    yield {
      type: "error",
      message: `Network error: Could not connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`,
    };
    return null;
  }

  if (!response.ok) {
    let text: string;
    try {
      text = await response.text();
    } catch {
      text = "(could not read response body)";
    }
    yield {
      type: "error",
      message: `Error: Ollama returned HTTP ${response.status}: ${text}`,
    };
    return null;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: "error", message: "Error: No response body stream" };
    return null;
  }

  const compiler = createSpecStreamCompiler<Spec>(
    initialSpec ? (initialSpec as unknown as Partial<Spec>) : undefined,
  );
  const decoder = new TextDecoder();
  let buffer = "";
  let thinkingContent = "";
  let rawContent = "";
  let currentSpec: AppSpec | null = initialSpec ?? null;
  const rawLines: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        let chunk: Record<string, unknown>;
        try {
          chunk = JSON.parse(line);
        } catch {
          continue;
        }

        const message = chunk.message as
          | { thinking?: string; content?: string }
          | undefined;
        if (!message) continue;

        if (message.thinking) {
          thinkingContent += message.thinking;
          onDiagnostics?.({ thinkingContent });
        }

        if (message.content) {
          rawContent += message.content;
          const { result, newPatches } = compiler.push(message.content);

          if (newPatches.length > 0) {
            for (const patch of newPatches) {
              rawLines.push(JSON.stringify(patch));
            }
            currentSpec = { ...result } as AppSpec;
            onDiagnostics?.({ rawLines: [...rawLines] });
          }
        }

        yield {
          type: "progress",
          result: { thinkingContent, rawContent, spec: currentSpec, rawLines: [...rawLines] },
        };
      }
    }

    // Flush decoder
    buffer += decoder.decode();
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer) as Record<string, unknown>;
        const message = chunk.message as
          | { thinking?: string; content?: string }
          | undefined;
        if (message?.content) {
          rawContent += message.content;
          const { result, newPatches } = compiler.push(message.content);
          if (newPatches.length > 0) {
            for (const patch of newPatches) {
              rawLines.push(JSON.stringify(patch));
            }
            currentSpec = { ...result } as AppSpec;
            onDiagnostics?.({ rawLines: [...rawLines] });
          }
        }
        if (message?.thinking) {
          thinkingContent += message.thinking;
          onDiagnostics?.({ thinkingContent });
        }
      } catch {
        // Buffer wasn't valid JSON
      }
    }

    const finalSpec = compiler.getResult() as AppSpec;
    if (finalSpec.root) {
      currentSpec = finalSpec;
    }

    return { thinkingContent, rawContent, spec: currentSpec, rawLines };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return null;
    yield {
      type: "error",
      message: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
    return null;
  } finally {
    reader.cancel().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Content plan
// ---------------------------------------------------------------------------

const CONTENT_PLAN_RULES = [
  "You are in PLANNING MODE. Do NOT output any JSONL patches or spec data.",
  "Analyze the user's request and output a structured content plan as conversational text.",
  "Structure your response as:",
  "1. A brief summary of what the UI should show",
  "2. A content hierarchy with Primary, Secondary, and Tertiary sections, naming concrete data elements",
  "3. One or two specific clarifying questions to surface assumptions",
  "Keep the plan concise — 5-10 lines maximum.",
];

async function* runContentPlan(
  userText: string,
  abortSignal: AbortSignal,
  onDiagnostics: DiagnosticsCallback | undefined,
): AsyncGenerator<ChatModelRunResult> {
  const systemPrompt = catalog.prompt({
    mode: "inline",
    customRules: CONTENT_PLAN_RULES,
  });
  onDiagnostics?.({
    isGenerating: true,
    thinkingContent: "",
    rawLines: [],
    error: null,
    rawJson: null,
    systemPrompt,
  });

  const stream = streamFromOllama(systemPrompt, userText, abortSignal, onDiagnostics);

  let finalText = "";

  for await (const event of stream) {
    if (event.type === "error") {
      onDiagnostics?.({ error: event.message, isGenerating: false });
      yield { content: [{ type: "text" as const, text: event.message }] };
      return;
    }

    // During content plan, show thinking + accumulating text
    const parts: ChatModelRunResult["content"] = [];
    if (event.result.thinkingContent) {
      parts.push({ type: "reasoning" as const, text: event.result.thinkingContent });
    }
    // The LLM's raw text output IS the content plan
    if (event.result.rawContent) {
      finalText = event.result.rawContent;
      parts.push({ type: "text" as const, text: finalText });
    }
    if (parts.length === 0) {
      parts.push({ type: "text" as const, text: "" });
    }
    yield { content: parts as unknown as ChatModelRunResult["content"] };
  }

  // Final yield with complete status
  onDiagnostics?.({ isGenerating: false });
  const finalParts: ChatModelRunResult["content"] = [];
  if (finalText) {
    finalParts.push({ type: "text" as const, text: finalText });
  } else {
    finalParts.push({ type: "text" as const, text: "I wasn't able to generate a content plan. Please try rephrasing your request." });
  }
  yield {
    content: finalParts as unknown as ChatModelRunResult["content"],
    status: { type: "complete" as const, reason: "stop" as const },
  };
}

// ---------------------------------------------------------------------------
// Phase 2: Skeleton spec generation
// ---------------------------------------------------------------------------

const SKELETON_RULES = [
  "You are in LAYOUT MODE. Build a skeleton UI spec with the correct tree structure.",
  "Select the appropriate components from the catalog and arrange them in a logical hierarchy.",
  "For layout primitives (Stack, Box, Center, Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel): use null for all props.",
  "For content components (Text, Heading, Badge): use empty string '' for required text props.",
  "For data components (Table): use empty arrays [] for columns and rows.",
  "For Metric: use empty strings '' for label and value, null for description and trend.",
  "For BarGraph: use null for title, empty array [] for data, null for color.",
  "For Card: use null for title and description.",
  "EVERY element MUST have a 'children' array (even if empty).",
  "Focus on tree structure and component selection. Do NOT fill in actual content.",
];

async function* runSkeletonGeneration(
  userText: string,
  contentPlan: string,
  abortSignal: AbortSignal,
  onDiagnostics: DiagnosticsCallback | undefined,
): AsyncGenerator<ChatModelRunResult, AppSpec | null> {
  const systemPrompt = catalog.prompt({
    mode: "standalone",
    customRules: SKELETON_RULES,
  });
  onDiagnostics?.({
    isGenerating: true,
    thinkingContent: "",
    rawLines: [],
    error: null,
    rawJson: null,
    systemPrompt,
  });

  const userMessage = `${userText}\n\n## Content Plan\n${contentPlan}`;

  const stream = streamFromOllama(systemPrompt, userMessage, abortSignal, onDiagnostics);

  let streamResult: StreamResult | null = null;

  for await (const event of stream) {
    if (event.type === "error") {
      onDiagnostics?.({ error: event.message, isGenerating: false });
      yield { content: [{ type: "text" as const, text: event.message }] };
      return null;
    }

    streamResult = event.result;
    yield buildSpecResult(event.result.thinkingContent, event.result.spec);
  }

  // Get final result from generator return value
  const finalResult = await stream.next();
  if (finalResult.value && typeof finalResult.value === "object" && "spec" in finalResult.value) {
    streamResult = finalResult.value as StreamResult;
  }

  if (!streamResult?.spec) {
    onDiagnostics?.({ isGenerating: false });
    yield {
      content: [{ type: "text" as const, text: "Failed to generate a layout skeleton. Please try again." }],
      status: { type: "complete" as const, reason: "stop" as const },
    };
    return null;
  }

  // Validate the skeleton
  const { spec: fixedSpec } = autoFixSpec(streamResult.spec as unknown as Spec);
  const validation = validateSpec(fixedSpec);

  if (validation.valid) {
    onDiagnostics?.({
      rawJson: JSON.stringify(fixedSpec, null, 2),
    });
    return fixedSpec as unknown as AppSpec;
  }

  // Retry once with error feedback
  const issuesText = formatSpecIssues(validation.issues);
  const retryMessage = `${userMessage}\n\n## Validation Errors (fix these)\n${issuesText}`;

  onDiagnostics?.({ rawLines: [], thinkingContent: "" });
  const retryStream = streamFromOllama(systemPrompt, retryMessage, abortSignal, onDiagnostics);

  let retryResult: StreamResult | null = null;

  for await (const event of retryStream) {
    if (event.type === "error") {
      onDiagnostics?.({ error: event.message, isGenerating: false });
      yield { content: [{ type: "text" as const, text: event.message }] };
      return null;
    }
    retryResult = event.result;
    yield buildSpecResult(event.result.thinkingContent, event.result.spec);
  }

  const retryFinal = await retryStream.next();
  if (retryFinal.value && typeof retryFinal.value === "object" && "spec" in retryFinal.value) {
    retryResult = retryFinal.value as StreamResult;
  }

  if (!retryResult?.spec) {
    onDiagnostics?.({ isGenerating: false });
    yield {
      content: [{ type: "text" as const, text: "Layout generation failed after retry. Please try a simpler request." }],
      status: { type: "complete" as const, reason: "stop" as const },
    };
    return null;
  }

  const { spec: retryFixed } = autoFixSpec(retryResult.spec as unknown as Spec);
  const retryValidation = validateSpec(retryFixed);

  if (!retryValidation.valid) {
    const retryIssues = formatSpecIssues(retryValidation.issues);
    onDiagnostics?.({ error: `Validation failed after retry: ${retryIssues}`, isGenerating: false });
    // Continue anyway with the best-effort spec — SimpleRenderer's orphan handling can salvage it
  }

  onDiagnostics?.({
    rawJson: JSON.stringify(retryFixed, null, 2),
  });
  return retryFixed as unknown as AppSpec;
}

// ---------------------------------------------------------------------------
// Phase 3: Content population
// ---------------------------------------------------------------------------

const CONTENT_RULES = [
  "You are in CONTENT MODE. Fill in all empty prop values in the existing spec.",
  "Generate JSONL patches (RFC 6902) that replace empty strings, empty arrays, and null content values with real data.",
  "Only target element keys that exist in the current spec.",
  "Use 'replace' operations for existing props.",
  "Make the content relevant to the user's original request.",
  "Generate realistic, specific data — not placeholder text.",
];

async function* runContentPopulation(
  userText: string,
  skeletonSpec: AppSpec,
  abortSignal: AbortSignal,
  onDiagnostics: DiagnosticsCallback | undefined,
): AsyncGenerator<ChatModelRunResult> {
  const systemPrompt = catalog.prompt({
    mode: "standalone",
    customRules: CONTENT_RULES,
  });

  // Use buildUserPrompt to include the skeleton spec as context (triggers edit/patch mode)
  const userMessage = buildUserPrompt({
    prompt: userText,
    currentSpec: skeletonSpec as unknown as Spec,
  });

  // Don't reset thinkingContent — preserve Phase 2's reasoning in the accordion
  onDiagnostics?.({
    isGenerating: true,
    rawLines: [],
    error: null,
    systemPrompt,
  });

  const stream = streamFromOllama(
    systemPrompt,
    userMessage,
    abortSignal,
    onDiagnostics,
    skeletonSpec,
  );

  for await (const event of stream) {
    if (event.type === "error") {
      onDiagnostics?.({ error: event.message, isGenerating: false });
      yield { content: [{ type: "text" as const, text: event.message }] };
      return;
    }

    // Don't show Phase 3 reasoning — it replaces Phase 2's thinking block.
    // Just show the spec being populated progressively.
    yield buildSpecResult("", event.result.spec);
  }

  // Get final from generator return
  const finalResult = await stream.next();
  const finalSpec =
    finalResult.value && typeof finalResult.value === "object" && "spec" in finalResult.value
      ? (finalResult.value as StreamResult).spec
      : null;

  onDiagnostics?.({
    isGenerating: false,
    rawJson: finalSpec ? JSON.stringify(finalSpec, null, 2) : null,
  });

  yield {
    ...buildSpecResult("", finalSpec),
    status: { type: "complete" as const, reason: "stop" as const },
  };
}

// ---------------------------------------------------------------------------
// Result builders
// ---------------------------------------------------------------------------

function buildSpecResult(
  thinkingContent: string,
  spec: AppSpec | null,
): ChatModelRunResult {
  const parts: Array<
    | { type: "reasoning"; text: string }
    | { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, unknown> }
    | { type: "text"; text: string }
  > = [];

  if (thinkingContent) {
    parts.push({ type: "reasoning", text: thinkingContent });
  }

  if (spec) {
    parts.push({
      type: "tool-call",
      toolCallId: TOOL_CALL_ID,
      toolName: "render_ui",
      args: { spec },
    });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", text: "" });
  }

  return { content: parts as unknown as ChatModelRunResult["content"] };
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

/**
 * Creates a ChatModelAdapter that orchestrates the 3-phase pipeline.
 *
 * Phase 1: Content plan — conversational text describing what to build
 * Phase 2: Skeleton layout — JSONL spec with correct structure, empty props
 * Phase 3: Content population — JSONL patches filling in prop values
 */
export function createOllamaAdapter(
  onDiagnostics?: DiagnosticsCallback,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const { phase, contentPlan } = detectPhase(messages);

      // Extract the user's original prompt (first user message)
      const firstUserMessage = messages.find((m) => m.role === "user");
      const originalPrompt = firstUserMessage
        ? firstUserMessage.content
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("\n")
        : "";

      // Extract the latest user message (may be confirmation or refinement)
      const lastUserMessage = messages.findLast((m) => m.role === "user");
      const latestText = lastUserMessage
        ? lastUserMessage.content
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("\n")
        : "";

      if (phase === "content-plan") {
        yield* runContentPlan(latestText, abortSignal, onDiagnostics);
        return;
      }

      if (phase === "layout" && contentPlan) {
        // Phase 2: Generate skeleton
        const skeleton = yield* runSkeletonGeneration(
          originalPrompt,
          contentPlan,
          abortSignal,
          onDiagnostics,
        );

        if (!skeleton) return;

        // Phase 3: Populate content (continues in same run)
        yield* runContentPopulation(
          originalPrompt,
          skeleton,
          abortSignal,
          onDiagnostics,
        );
        return;
      }

      // Fallback: single-call generation (no pipeline)
      yield* runContentPlan(latestText, abortSignal, onDiagnostics);
    },
  };
}

// Keep a static instance for tests that import ollamaAdapter directly
export const ollamaAdapter = createOllamaAdapter();

// ---------------------------------------------------------------------------
// Provider components
// ---------------------------------------------------------------------------

export function OllamaRuntimeProvider({ children }: { children: ReactNode }) {
  return (
    <DiagnosticsProvider>
      <OllamaRuntimeInner>{children}</OllamaRuntimeInner>
    </DiagnosticsProvider>
  );
}

function OllamaRuntimeInner({ children }: { children: ReactNode }) {
  const { setState } = useDiagnosticsDispatch();

  const adapter = useMemo(() => createOllamaAdapter(setState), [setState]);
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
