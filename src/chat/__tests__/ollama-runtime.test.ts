import { describe, it, expect, vi, beforeEach } from "vitest";
import { ollamaAdapter } from "../ollama-runtime";
import type { ChatModelRunOptions } from "@assistant-ui/react";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/**
 * Helper: simulate an Ollama streaming response.
 */
function streamingResponse(
  chunks: Array<{ thinking?: string; content?: string }>,
) {
  const lines = chunks.map((c) =>
    JSON.stringify({ message: { role: "assistant", ...c } }),
  );

  let index = 0;
  const readable = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < lines.length) {
        controller.enqueue(new TextEncoder().encode(lines[index] + "\n"));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

// JSONL patch lines the LLM would produce
const PATCH_ROOT = '{"op":"add","path":"/root","value":"metric-1"}';
const PATCH_ELEMENT =
  '{"op":"add","path":"/elements/metric-1","value":{"type":"Metric","props":{"label":"Revenue","value":"$1.2M","description":null,"trend":"up"},"children":[]}}';

function makeRunOptions(
  userText: string,
  abortSignal?: AbortSignal,
): ChatModelRunOptions {
  return {
    messages: [
      {
        id: "msg-1",
        role: "user" as const,
        content: [{ type: "text" as const, text: userText }],
        createdAt: new Date(),
        metadata: {},
      },
    ],
    abortSignal: abortSignal ?? new AbortController().signal,
    runConfig: {},
    context: {
      tools: {},
    },
    config: { tools: {} },
    unstable_getMessage: () => ({
      id: "msg-2",
      role: "assistant" as const,
      content: [],
      createdAt: new Date(),
      metadata: {},
      status: { type: "running" as const },
    }),
  } as unknown as ChatModelRunOptions;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ollamaAdapter", () => {
  it("yields tool-call content parts with accumulated spec", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: PATCH_ROOT + "\n" },
        { content: PATCH_ELEMENT + "\n" },
      ]),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(makeRunOptions("show me revenue"));

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    // Should have yielded results during streaming
    expect(results.length).toBeGreaterThan(0);

    // The final result should contain a tool-call with the spec
    const lastResult = results[results.length - 1];
    const toolCall = lastResult.content.find(
      (p: any) => p.type === "tool-call",
    ) as any;
    expect(toolCall).toBeDefined();
    expect(toolCall.toolName).toBe("render_ui");
    expect(toolCall.args.spec.root).toBe("metric-1");
    expect(toolCall.args.spec.elements["metric-1"].type).toBe("Metric");
  });

  it("yields 'Thinking…' text during thinking, then tool-call when spec arrives", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { thinking: "Let me think about this..." },
        { thinking: " I should use a Metric." },
        { content: PATCH_ROOT + "\n" },
        { content: PATCH_ELEMENT + "\n" },
      ]),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(makeRunOptions("show me revenue"));

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    // During thinking: text part says "Thinking…"
    const thinkingResult = results.find((r) =>
      r.content.some(
        (p: any) => p.type === "text" && p.text === "Thinking…",
      ),
    );
    expect(thinkingResult).toBeDefined();

    // After spec arrives: tool-call part present (no more text status)
    const specResult = results.find((r) =>
      r.content.some((p: any) => p.type === "tool-call"),
    );
    expect(specResult).toBeDefined();
  });

  it("handles AbortSignal cancellation", async () => {
    const controller = new AbortController();

    // Pre-abort before fetch — fetch should throw AbortError
    controller.abort();

    mockFetch.mockRejectedValueOnce(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(
      makeRunOptions("test", controller.signal),
    );

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    // Should not have yielded any error content — just silently returns
    expect(results.length).toBe(0);
  });

  it("yields error text when Ollama is unreachable", async () => {
    mockFetch.mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(makeRunOptions("test"));

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    expect(results.length).toBeGreaterThan(0);
    const lastResult = results[results.length - 1];
    const errorPart = lastResult.content.find(
      (p: any) => p.type === "text",
    ) as any;
    expect(errorPart).toBeDefined();
    expect(errorPart.text).toContain("Network error");
  });

  it("yields error text when Ollama returns non-200", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(makeRunOptions("test"));

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    const lastResult = results[results.length - 1];
    const errorPart = lastResult.content.find(
      (p: any) => p.type === "text",
    ) as any;
    expect(errorPart.text).toContain("HTTP 500");
  });
});
