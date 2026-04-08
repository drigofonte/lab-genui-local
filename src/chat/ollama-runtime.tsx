import { type ReactNode, useMemo } from "react";
import {
  useLocalRuntime,
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  type ChatModelRunResult,
} from "@assistant-ui/react";
import { createSpecStreamCompiler, type Spec } from "@json-render/core";
import { catalog, type AppSpec } from "@/catalog/catalog";
import { MODEL_NAME, OLLAMA_BASE_URL, NUM_PREDICT } from "@/adapter/config";
import {
  DiagnosticsProvider,
  useDiagnosticsDispatch,
  type DiagnosticsState,
} from "./diagnostics-context";

const TOOL_CALL_ID = "render_ui";

type DiagnosticsCallback = (partial: Partial<DiagnosticsState>) => void;

/**
 * Creates a ChatModelAdapter that wraps Ollama streaming.
 * Accepts an optional diagnostics callback for streaming state to the debug panel.
 */
export function createOllamaAdapter(
  onDiagnostics?: DiagnosticsCallback,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const systemPrompt = catalog.prompt();
        onDiagnostics?.({
        isGenerating: true,
        thinkingContent: "",
        rawLines: [],
        error: null,
        rawJson: null,
        systemPrompt,
      });

      // Extract the last user message text
      const lastUserMessage = messages.findLast((m) => m.role === "user");
      const userText = lastUserMessage
        ? lastUserMessage.content
            .filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join("\n")
        : "";

      const userMessage = userText;

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
        if (err instanceof DOMException && err.name === "AbortError") return;
        const errorMsg = `Network error: Could not connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`;
        onDiagnostics?.({ error: errorMsg, isGenerating: false });
        yield { content: [{ type: "text" as const, text: errorMsg }] };
        return;
      }

      if (!response.ok) {
        let text: string;
        try {
          text = await response.text();
        } catch {
          text = "(could not read response body)";
        }
        const errorMsg = `Error: Ollama returned HTTP ${response.status}: ${text}`;
        onDiagnostics?.({ error: errorMsg, isGenerating: false });
        yield { content: [{ type: "text" as const, text: errorMsg }] };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onDiagnostics?.({
          error: "No response body stream",
          isGenerating: false,
        });
        yield {
          content: [
            { type: "text" as const, text: "Error: No response body stream" },
          ],
        };
        return;
      }

      const compiler = createSpecStreamCompiler<Spec>();
      const decoder = new TextDecoder();
      let buffer = "";
      let thinkingContent = "";
      let currentSpec: AppSpec | null = null;
      const rawLines: string[] = [];

      // Yield immediately so the user sees "Connecting..." in the chat
      yield buildResult(thinkingContent, currentSpec);

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
              const { result, newPatches } = compiler.push(message.content);

              if (newPatches.length > 0) {
                for (const patch of newPatches) {
                  rawLines.push(JSON.stringify(patch));
                }
                currentSpec = { ...result } as AppSpec;
                onDiagnostics?.({ rawLines: [...rawLines] });
              }
            }

            yield buildResult(thinkingContent, currentSpec);
          }
        }

        // Flush decoder and process any remaining buffered line
        // (Ollama may not end the last chunk with a trailing newline)
        buffer += decoder.decode();
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer) as Record<string, unknown>;
            const message = chunk.message as
              | { thinking?: string; content?: string }
              | undefined;
            if (message?.content) {
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
            // Buffer wasn't valid JSON — nothing to process
          }
        }

        // Final result with completed spec
        const finalSpec = compiler.getResult() as AppSpec;
        if (finalSpec.root) {
          currentSpec = finalSpec;
        }

        onDiagnostics?.({
          isGenerating: false,
          rawJson: currentSpec
            ? JSON.stringify(currentSpec, null, 2)
            : null,
        });

        yield {
          ...buildResult(thinkingContent, currentSpec),
          status: { type: "complete" as const, reason: "stop" as const },
        };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          onDiagnostics?.({ isGenerating: false });
          return;
        }

        const errorMsg = `Error: ${err instanceof Error ? err.message : String(err)}`;
        onDiagnostics?.({ error: errorMsg, isGenerating: false });
        yield { content: [{ type: "text" as const, text: errorMsg }] };
      } finally {
        reader.cancel().catch(() => {});
      }
    },
  };
}

// Keep a static instance for tests that import ollamaAdapter directly
export const ollamaAdapter = createOllamaAdapter();

function buildResult(
  thinkingContent: string,
  spec: AppSpec | null,
): ChatModelRunResult {
  const parts: Array<
    | { type: "reasoning"; text: string }
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        args: Record<string, unknown>;
      }
    | { type: "text"; text: string }
  > = [];

  if (spec) {
    // tool-call renders the status indicator via tool UI (with animation)
    // and syncs spec to center panel
    parts.push({
      type: "tool-call",
      toolCallId: TOOL_CALL_ID,
      toolName: "render_ui",
      args: { spec },
    });
  } else if (thinkingContent) {
    parts.push({ type: "text", text: "Thinking…" });
  } else {
    parts.push({ type: "text", text: "Connecting to model…" });
  }

  return { content: parts as unknown as ChatModelRunResult["content"] };
}

/**
 * Provider component that wraps the app with the Ollama-powered assistant-ui runtime.
 * Also provides DiagnosticsProvider for the debug panel.
 */
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
