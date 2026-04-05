import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateUI, type StreamProgress } from "../ollama";
import { NUM_PREDICT } from "../config";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/**
 * Helper: simulate an Ollama streaming response.
 * Each item in `chunks` is an Ollama JSON line (one per chunk).
 */
function streamingResponse(chunks: Array<{ thinking?: string; content?: string }>) {
  const lines = chunks.map((c) =>
    JSON.stringify({ message: { role: "assistant", ...c } })
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
const PATCH_ELEMENT = '{"op":"add","path":"/elements/metric-1","value":{"type":"Metric","props":{"label":"Revenue","value":"$1.2M","description":null,"trend":"up"},"children":[]}}';

beforeEach(() => {
  mockFetch.mockReset();
});

describe("generateUI (JSONL patch streaming)", () => {
  it("builds spec progressively from JSONL patches", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: PATCH_ROOT + "\n" },
        { content: PATCH_ELEMENT + "\n" },
      ])
    );

    const result = await generateUI("show me revenue");

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.spec.root).toBe("metric-1");
      expect((result.spec.elements as Record<string, unknown>)["metric-1"]).toBeDefined();
    }
  });

  it("calls onProgress with partial spec after each patch", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: PATCH_ROOT + "\n" },
        { content: PATCH_ELEMENT + "\n" },
      ])
    );

    const progressCalls: StreamProgress[] = [];
    await generateUI("test", (p) => progressCalls.push({ ...p }));

    const generatingCalls = progressCalls.filter((p) => p.phase === "generating");
    expect(generatingCalls.length).toBeGreaterThanOrEqual(1);
    // First generating call should have root set
    expect(generatingCalls[0].spec?.root).toBe("metric-1");
    // Should track raw lines
    expect(generatingCalls[generatingCalls.length - 1].rawLines.length).toBeGreaterThanOrEqual(1);
  });

  it("separates thinking from content — thinking doesn't affect spec", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { thinking: "Let me think about this..." },
        { thinking: "I should create a metric." },
        { content: PATCH_ROOT + "\n" },
        { content: PATCH_ELEMENT + "\n" },
      ])
    );

    const progressCalls: StreamProgress[] = [];
    const result = await generateUI("test", (p) => progressCalls.push({ ...p }));

    // Thinking phase should fire
    const thinkingCalls = progressCalls.filter((p) => p.phase === "thinking");
    expect(thinkingCalls.length).toBe(2);
    expect(thinkingCalls[1].thinkingContent).toContain("metric");

    // Spec should still be built correctly
    expect(result.status).toBe("success");
  });

  it("handles partial lines across chunks — buffers until newline", async () => {
    // Split a patch line across two chunks
    const half1 = PATCH_ROOT.slice(0, 20);
    const half2 = PATCH_ROOT.slice(20) + "\n";

    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: half1 },
        { content: half2 },
        { content: PATCH_ELEMENT + "\n" },
      ])
    );

    const result = await generateUI("test");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.spec.root).toBe("metric-1");
    }
  });

  it("handles multiple complete JSONL lines in one chunk", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: PATCH_ROOT + "\n" + PATCH_ELEMENT + "\n" },
      ])
    );

    const progressCalls: StreamProgress[] = [];
    const result = await generateUI("test", (p) => progressCalls.push({ ...p }));

    expect(result.status).toBe("success");
    // Should have processed both patches
    const genCalls = progressCalls.filter((p) => p.phase === "generating");
    expect(genCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("silently skips invalid/prose lines and applies valid patches", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: "Here is your dashboard:\n" },
        { content: PATCH_ROOT + "\n" },
        { content: "Adding some elements...\n" },
        { content: PATCH_ELEMENT + "\n" },
      ])
    );

    const result = await generateUI("test");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.spec.root).toBe("metric-1");
    }
  });

  it("returns error when no valid patches are found", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([
        { content: "I cannot generate a UI for that.\n" },
        { content: "Please try a different prompt.\n" },
      ])
    );

    const result = await generateUI("test");
    expect(result.status).toBe("error");
  });

  it("falls back to JSON.parse when LLM outputs complete JSON instead of patches", async () => {
    const completeJson = JSON.stringify({
      root: "metric-1",
      elements: {
        "metric-1": {
          type: "Metric",
          props: { label: "Revenue", value: "$1.2M", description: null, trend: "up" },
          children: [],
        },
      },
    });

    mockFetch.mockResolvedValueOnce(
      streamingResponse([{ content: completeJson }])
    );

    const result = await generateUI("test");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.spec.root).toBe("metric-1");
    }
  });

  it("sends correct request body — no format:json", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([{ content: PATCH_ROOT + "\n" + PATCH_ELEMENT + "\n" }])
    );

    await generateUI("test");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.stream).toBe(true);
    expect(body.format).toBeUndefined();
    expect(body.options.num_predict).toBe(NUM_PREDICT);
    expect(body.options.temperature).toBe(0.1);
  });

  it("system prompt contains JSONL/patch instructions from catalog.prompt()", async () => {
    mockFetch.mockResolvedValueOnce(
      streamingResponse([{ content: PATCH_ROOT + "\n" + PATCH_ELEMENT + "\n" }])
    );

    const result = await generateUI("test");
    expect(result.systemPrompt).toContain("Metric");
    expect(result.systemPrompt).toContain("Card");
    expect(result.systemPrompt).toContain("JSONL");
  });

  it("returns error with CORS hint for network errors", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await generateUI("test");
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toContain("CORS");
    }
  });
});
