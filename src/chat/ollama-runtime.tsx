import { type ReactNode } from "react";
import {
  useLocalRuntime,
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  type ChatModelRunResult,
} from "@assistant-ui/react";
import { createSpecStreamCompiler, type Spec } from "@json-render/core";
import { catalog, type AppSpec } from "@/catalog/catalog";
import { MODEL_NAME, OLLAMA_BASE_URL, NUM_PREDICT } from "@/adapter/config";
import { formatSampleDataForPrompt } from "@/adapter/sample-data";

const TOOL_CALL_ID = "render_ui";

/**
 * ChatModelAdapter that wraps Ollama streaming.
 *
 * The adapter's `run` async generator:
 * 1. Builds a system prompt from the catalog
 * 2. Calls Ollama's /api/chat with streaming
 * 3. Feeds content chunks to createSpecStreamCompiler
 * 4. Yields cumulative content parts:
 *    - text parts for thinking content
 *    - tool-call parts with the partial spec as patches arrive
 */
export const ollamaAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const systemPrompt = catalog.prompt();
    const sampleDataContext = formatSampleDataForPrompt();

    // Extract the last user message text
    const lastUserMessage = messages.findLast((m) => m.role === "user");
    const userText = lastUserMessage
      ? lastUserMessage.content
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("\n")
      : "";

    const userMessage = `${userText}\n\n${sampleDataContext}`;

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
      yield {
        content: [
          {
            type: "text" as const,
            text: `Network error: Could not connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`,
          },
        ],
      };
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      yield {
        content: [
          {
            type: "text" as const,
            text: `Error: Ollama returned HTTP ${response.status}: ${text}`,
          },
        ],
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
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
          }

          if (message.content) {
            const { result, newPatches } = compiler.push(message.content);

            if (newPatches.length > 0) {
              currentSpec = { ...result } as AppSpec;
            }
          }

          // Yield cumulative content
          yield buildResult(thinkingContent, currentSpec);
        }
      }

      // Final result with completed spec
      const finalSpec = compiler.getResult() as AppSpec;
      if (finalSpec.root) {
        currentSpec = finalSpec;
      }

      const finalResult = buildResult(thinkingContent, currentSpec);
      finalResult.status = { type: "complete", reason: "stop" };
      yield finalResult;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      yield {
        content: [
          {
            type: "text" as const,
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
};

function buildResult(
  thinkingContent: string,
  spec: AppSpec | null,
): ChatModelRunResult {
  const content: ChatModelRunResult["content"] = [];

  if (thinkingContent) {
    content.push({ type: "reasoning" as const, text: thinkingContent });
  }

  if (spec) {
    content.push({
      type: "tool-call" as const,
      toolCallId: TOOL_CALL_ID,
      toolName: "render_ui",
      args: { spec },
    });
  }

  if (content.length === 0) {
    content.push({ type: "text" as const, text: "" });
  }

  return { content: content as ChatModelRunResult["content"] };
}

/**
 * Provider component that wraps the app with the Ollama-powered assistant-ui runtime.
 */
export function OllamaRuntimeProvider({ children }: { children: ReactNode }) {
  const runtime = useLocalRuntime(ollamaAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
