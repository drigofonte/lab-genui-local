import { catalog, type AppSpec } from "@/catalog/catalog";
import { MODEL_NAME, OLLAMA_BASE_URL, NUM_PREDICT } from "./config";
import { formatSampleDataForPrompt } from "./sample-data";
import { SYSTEM_PROMPT } from "./system-prompt";

export type GenerationResult =
  | {
      status: "success";
      spec: AppSpec;
      rawJson: string;
      systemPrompt: string;
    }
  | {
      status: "error";
      rawResponse: string;
      error: string;
      systemPrompt: string;
    };

export type StreamPhase = "connecting" | "thinking" | "generating" | "done";

export interface StreamProgress {
  phase: StreamPhase;
  thinkingContent: string;
  generatedContent: string;
}

export type OnProgress = (progress: StreamProgress) => void;

export async function generateUI(
  prompt: string,
  onProgress?: OnProgress
): Promise<GenerationResult> {
  const systemPrompt = SYSTEM_PROMPT;
  const sampleDataContext = formatSampleDataForPrompt();
  const userMessage = `${prompt}\n\n${sampleDataContext}`;

  onProgress?.({ phase: "connecting", thinkingContent: "", generatedContent: "" });

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
        format: "json",
        options: {
          num_predict: NUM_PREDICT,
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        status: "error",
        rawResponse: text,
        error: `Ollama returned HTTP ${response.status}: ${text}`,
        systemPrompt,
      };
    }

    // Read the streaming response
    let thinkingContent = "";
    let generatedContent = "";
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        status: "error",
        rawResponse: "",
        error: "No response body stream available",
        systemPrompt,
      };
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines (each line is a JSON object)
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete last line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        let chunk: any;
        try {
          chunk = JSON.parse(line);
        } catch {
          continue; // Skip malformed chunks
        }

        const message = chunk.message;
        if (!message) continue;

        if (message.thinking) {
          thinkingContent += message.thinking;
          onProgress?.({
            phase: "thinking",
            thinkingContent,
            generatedContent,
          });
        }

        if (message.content) {
          generatedContent += message.content;
          onProgress?.({
            phase: "generating",
            thinkingContent,
            generatedContent,
          });
        }
      }
    }

    onProgress?.({ phase: "done", thinkingContent, generatedContent });

    const rawContent = generatedContent;

    if (!rawContent.trim()) {
      return {
        status: "error",
        rawResponse: thinkingContent
          ? `Model produced thinking but no content output.\n\nThinking:\n${thinkingContent.slice(0, 500)}`
          : "Ollama returned an empty response (no content).",
        error: thinkingContent
          ? `Model produced thinking but no JSON content. The thinking output was ${thinkingContent.length} chars. Check the Raw JSON tab for details.`
          : "Ollama returned an empty response (no message content).",
        systemPrompt,
      };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return {
        status: "error",
        rawResponse: rawContent,
        error: `Failed to parse JSON from LLM response:\n${rawContent.slice(0, 1000)}`,
        systemPrompt,
      };
    }

    // Validate against catalog schema
    const result = catalog.validate(parsed);
    if (result.success) {
      return {
        status: "success",
        spec: result.data as AppSpec,
        rawJson: JSON.stringify(parsed, null, 2),
        systemPrompt,
      };
    }

    return {
      status: "error",
      rawResponse: JSON.stringify(parsed, null, 2),
      error: `Catalog validation failed:\n${result.error?.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`,
      systemPrompt,
    };
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError && err.message.includes("fetch");

    return {
      status: "error",
      rawResponse: "",
      error: isNetworkError
        ? `Network error: Could not connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running? If you see a CORS error in the console, set OLLAMA_ORIGINS="http://localhost:*" and restart Ollama.`
        : `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      systemPrompt,
    };
  }
}
