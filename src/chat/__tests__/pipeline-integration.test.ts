import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOllamaAdapter } from "../ollama-runtime";
import type { ChatModelRunOptions } from "@assistant-ui/react";
import type { DiagnosticsState } from "../diagnostics-context";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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
  return new Response(readable, { status: 200 });
}

const SKELETON_PATCHES = [
  '{"op":"add","path":"/root","value":"dashboard"}',
  '{"op":"add","path":"/elements/dashboard","value":{"type":"Stack","props":{"space":null},"children":["metric-1"]}}',
  '{"op":"add","path":"/elements/metric-1","value":{"type":"Metric","props":{"label":"","value":"","description":null,"trend":null},"children":[]}}',
];

const CONTENT_PATCHES = [
  '{"op":"replace","path":"/elements/metric-1/props/label","value":"Total Revenue"}',
  '{"op":"replace","path":"/elements/metric-1/props/value","value":"$124K"}',
];

function makeRunOptions(
  messages: ChatModelRunOptions["messages"],
): ChatModelRunOptions {
  return {
    messages,
    abortSignal: new AbortController().signal,
    runConfig: {},
    context: { tools: {} },
    config: { tools: {} },
    unstable_getMessage: () => ({
      id: "resp",
      role: "assistant" as const,
      content: [],
      createdAt: new Date(),
      metadata: {},
      status: { type: "running" as const },
    }),
  } as unknown as ChatModelRunOptions;
}

async function collectResults(gen: ReturnType<ChatModelRunOptions["unstable_getMessage"]> | any) {
  const results: any[] = [];
  for await (const result of gen as AsyncGenerator) {
    results.push(result);
  }
  return results;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("Pipeline integration", () => {
  it("Phase 1: yields text content plan (no tool-call)", async () => {
    const adapter = createOllamaAdapter();

    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: "Content plan:\n- Primary: Revenue metric\n- Secondary: Bar chart" },
      ]),
    );

    const messages = [
      { id: "1", role: "user", content: [{ type: "text", text: "show me a revenue dashboard" }], createdAt: new Date(), metadata: {} },
    ] as unknown as ChatModelRunOptions["messages"];

    const results = await collectResults(adapter.run(makeRunOptions(messages)));

    // Should yield text (content plan)
    const lastResult = results[results.length - 1];
    const textPart = lastResult.content.find((p: any) => p.type === "text");
    expect(textPart).toBeDefined();
    expect(textPart.text).toContain("Content plan");

    // Should NOT yield tool-call
    const hasToolCall = results.some((r: any) =>
      r.content.some((p: any) => p.type === "tool-call"),
    );
    expect(hasToolCall).toBe(false);
  });

  it("Phase 2+3: generates skeleton then content when plan exists", async () => {
    const adapter = createOllamaAdapter();

    // Skeleton generation
    mockFetch.mockResolvedValueOnce(
      streamingResponse(SKELETON_PATCHES.map((p) => ({ content: p + "\n" }))),
    );
    // Content population
    mockFetch.mockResolvedValueOnce(
      streamingResponse(CONTENT_PATCHES.map((p) => ({ content: p + "\n" }))),
    );

    // Messages: user prompt → assistant content plan → user confirmation
    const messages = [
      { id: "1", role: "user", content: [{ type: "text", text: "show me a revenue dashboard" }], createdAt: new Date(), metadata: {} },
      { id: "2", role: "assistant", content: [{ type: "text", text: "Content plan: Primary - Revenue metric, Secondary - Chart with data" }], createdAt: new Date(), metadata: {}, status: { type: "complete", reason: "stop" } },
      { id: "3", role: "user", content: [{ type: "text", text: "looks good, proceed" }], createdAt: new Date(), metadata: {} },
    ] as unknown as ChatModelRunOptions["messages"];

    const results = await collectResults(adapter.run(makeRunOptions(messages)));

    // Should have tool-call results
    const toolCallResults = results.filter((r: any) =>
      r.content.some((p: any) => p.type === "tool-call"),
    );
    expect(toolCallResults.length).toBeGreaterThan(0);

    // Should have made 2 Ollama calls (skeleton + content)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("diagnostics receives phase transitions", async () => {
    const diagnostics: Partial<DiagnosticsState>[] = [];
    const adapter = createOllamaAdapter((p) => diagnostics.push({ ...p }));

    mockFetch.mockResolvedValueOnce(
      streamingResponse([{ content: "Plan: show some metrics and a chart" }]),
    );

    const messages = [
      { id: "1", role: "user", content: [{ type: "text", text: "dashboard" }], createdAt: new Date(), metadata: {} },
    ] as unknown as ChatModelRunOptions["messages"];

    await collectResults(adapter.run(makeRunOptions(messages)));

    const starts = diagnostics.filter((d) => d.isGenerating === true);
    const ends = diagnostics.filter((d) => d.isGenerating === false);
    expect(starts.length).toBeGreaterThan(0);
    expect(ends.length).toBeGreaterThan(0);

    const withPrompt = diagnostics.filter((d) => d.systemPrompt != null);
    expect(withPrompt.length).toBeGreaterThan(0);
  });
});
