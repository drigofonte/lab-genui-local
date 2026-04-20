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
  priorMessages?: ChatModelRunOptions["messages"],
): ChatModelRunOptions {
  let messages: ChatModelRunOptions["messages"];
  if (priorMessages) {
    messages = [
      ...priorMessages,
      {
        id: `msg-${priorMessages.length + 1}`,
        role: "user" as const,
        content: [{ type: "text" as const, text: userText }],
        createdAt: new Date(),
        metadata: {},
      },
    ] as unknown as ChatModelRunOptions["messages"];
  } else {
    messages = [
      {
        id: "msg-1",
        role: "user" as const,
        content: [{ type: "text" as const, text: userText }],
        createdAt: new Date(),
        metadata: {},
      },
    ] as unknown as ChatModelRunOptions["messages"];
  }

  return {
    messages,
    abortSignal: abortSignal ?? new AbortController().signal,
    runConfig: {},
    context: { tools: {} },
    config: { tools: {} },
    unstable_getMessage: () => ({
      id: "msg-resp",
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

describe("ollamaAdapter — Phase 1 (content plan)", () => {
  it("yields text content for content plan (no tool-call)", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: "I'd suggest showing:\n- Primary: 3 KPI metrics\n" },
        { content: "- Secondary: A bar chart\n" },
      ]),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(makeRunOptions("show me a dashboard"));

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    expect(results.length).toBeGreaterThan(0);

    // Should contain text parts (the content plan), not tool-call parts
    const lastResult = results[results.length - 1];
    const textPart = lastResult.content.find(
      (p: any) => p.type === "text",
    ) as any;
    expect(textPart).toBeDefined();
    expect(textPart.text).toContain("suggest");

    // Should NOT contain a tool-call
    const toolCall = lastResult.content.find(
      (p: any) => p.type === "tool-call",
    );
    expect(toolCall).toBeUndefined();
  });

  it("yields reasoning parts during thinking", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { thinking: "Let me analyze this request..." },
        { content: "Content plan: Primary - metrics" },
      ]),
    );

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(makeRunOptions("show me metrics"));

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    const reasoningResult = results.find((r) =>
      r.content.some((p: any) => p.type === "reasoning"),
    );
    expect(reasoningResult).toBeDefined();
  });
});

describe("ollamaAdapter — Phase 2+3 (layout + content)", () => {
  it("generates skeleton then content when content plan exists", async () => {
    // First call: Phase 2 (skeleton)
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: PATCH_ROOT + "\n" },
        { content: PATCH_ELEMENT + "\n" },
      ]),
    );

    // Second call: Phase 3 (content population)
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: '{"op":"replace","path":"/elements/metric-1/props/label","value":"Total Revenue"}\n' },
      ]),
    );

    // Simulate prior messages: user prompt + content plan + user confirm
    const priorMessages = [
      {
        id: "msg-1",
        role: "user" as const,
        content: [{ type: "text" as const, text: "show me revenue" }],
        createdAt: new Date(),
        metadata: {},
      },
      {
        id: "msg-2",
        role: "assistant" as const,
        content: [
          {
            type: "text" as const,
            text: "I'd suggest showing: Primary - Total Revenue metric",
          },
        ],
        createdAt: new Date(),
        metadata: {},
        status: { type: "complete" as const, reason: "stop" as const },
      },
    ] as unknown as ChatModelRunOptions["messages"];

    const results: Array<{ content: Array<Record<string, unknown>> }> = [];
    const gen = ollamaAdapter.run(
      makeRunOptions("yes, looks good", undefined, priorMessages),
    );

    for await (const result of gen as AsyncGenerator) {
      results.push(result as { content: Array<Record<string, unknown>> });
    }

    // Should have at least some results from Phase 2 and 3
    expect(results.length).toBeGreaterThan(0);

    // Should have tool-call results somewhere in the sequence
    const toolCallResults = results.filter((r) =>
      r.content.some((p: any) => p.type === "tool-call"),
    );
    expect(toolCallResults.length).toBeGreaterThan(0);

    // The tool-call should have a spec with the metric
    const lastToolCall = toolCallResults[toolCallResults.length - 1];
    const toolCall = lastToolCall.content.find(
      (p: any) => p.type === "tool-call",
    ) as any;
    expect(toolCall).toBeDefined();
    expect(toolCall.args.spec.root).toBe("metric-1");
  });
});

describe("ollamaAdapter — error handling", () => {
  it("handles AbortSignal cancellation", async () => {
    const controller = new AbortController();
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

    // Should not have yielded error content
    const hasErrorText = results.some((r: any) =>
      r.content?.some(
        (p: any) => p.type === "text" && p.text.startsWith("Error:"),
      ),
    );
    expect(hasErrorText).toBe(false);
  });

  it("yields error text when Ollama is unreachable", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

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
