import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateUI } from "../ollama";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function ollamaResponse(content: string) {
  return new Response(JSON.stringify({ message: { content } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const VALID_SPEC = JSON.stringify({
  root: "metric-1",
  elements: {
    "metric-1": {
      type: "Metric",
      props: {
        label: "Total Revenue",
        value: "$1.2M",
        description: null,
        trend: "up",
      },
      children: [],
    },
  },
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe("generateUI", () => {
  it("returns success with validated spec for valid JSON", async () => {
    mockFetch.mockResolvedValueOnce(ollamaResponse(VALID_SPEC));

    const result = await generateUI("show me total revenue");

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.spec.root).toBe("metric-1");
      expect(result.rawJson).toContain("Metric");
      expect(result.systemPrompt.length).toBeGreaterThan(0);
    }
  });

  it("passes system prompt from catalog.prompt()", async () => {
    mockFetch.mockResolvedValueOnce(ollamaResponse(VALID_SPEC));

    const result = await generateUI("test");

    // The system prompt should contain component names from our catalog
    expect(result.systemPrompt).toContain("Metric");
    expect(result.systemPrompt).toContain("Card");
    expect(result.systemPrompt).toContain("BarGraph");
  });

  it("includes user prompt and sample data in user message", async () => {
    mockFetch.mockResolvedValueOnce(ollamaResponse(VALID_SPEC));

    await generateUI("show me a dashboard");

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = callBody.messages[1].content;

    expect(userMessage).toContain("show me a dashboard");
    expect(userMessage).toContain("Quarterly Sales");
  });

  it("sends correct request body to Ollama", async () => {
    mockFetch.mockResolvedValueOnce(ollamaResponse(VALID_SPEC));

    await generateUI("test");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/chat");

    const body = JSON.parse(options.body);
    expect(body.stream).toBe(false);
    expect(body.format).toBe("json");
    expect(body.options.num_predict).toBe(4096);
    expect(body.options.temperature).toBe(0.1);
  });

  it("returns error when JSON fails catalog validation", async () => {
    const invalidSpec = JSON.stringify({
      root: "bad",
      elements: {
        bad: {
          type: "NonExistentComponent",
          props: {},
          children: [],
        },
      },
    });
    mockFetch.mockResolvedValueOnce(ollamaResponse(invalidSpec));

    const result = await generateUI("test");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toContain("validation");
    }
  });

  it("returns error for non-JSON response", async () => {
    mockFetch.mockResolvedValueOnce(
      ollamaResponse("Here is your dashboard...")
    );

    const result = await generateUI("test");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toContain("parse");
    }
  });

  it("returns error with CORS hint for network errors", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await generateUI("test");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error).toContain("CORS");
      expect(result.error).toContain("OLLAMA_ORIGINS");
    }
  });
});
