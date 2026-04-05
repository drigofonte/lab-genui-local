import { createSpecStreamCompiler, type Spec } from "@json-render/core";
import { catalog, type AppSpec } from "@/catalog/catalog";
import { MODEL_NAME, OLLAMA_BASE_URL, NUM_PREDICT } from "./config";
import { formatSampleDataForPrompt } from "./sample-data";

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
  /** Partial spec built from JSONL patches so far */
  spec: AppSpec | null;
  /** Raw JSONL lines received so far */
  rawLines: string[];
}

export type OnProgress = (progress: StreamProgress) => void;

export async function generateUI(
  prompt: string,
  onProgress?: OnProgress
): Promise<GenerationResult> {
  const systemPrompt = catalog.prompt();
  const sampleDataContext = formatSampleDataForPrompt();
  const userMessage = `${prompt}\n\n${sampleDataContext}`;

  const emptyProgress: StreamProgress = {
    phase: "connecting",
    thinkingContent: "",
    spec: null,
    rawLines: [],
  };
  onProgress?.(emptyProgress);

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

    // Stream response and build spec progressively via JSONL patches
    const compiler = createSpecStreamCompiler<Spec>();
    let thinkingContent = "";
    let rawContent = "";
    const rawLines: string[] = [];

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

      // Process complete Ollama JSON lines
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
          onProgress?.({
            phase: "thinking",
            thinkingContent,
            spec: null,
            rawLines,
          });
        }

        if (message.content) {
          rawContent += message.content;

          // Feed content tokens to the JSONL patch compiler
          const { result, newPatches } = compiler.push(message.content);

          if (newPatches.length > 0) {
            for (const patch of newPatches) {
              rawLines.push(JSON.stringify(patch));
            }
            onProgress?.({
              phase: "generating",
              thinkingContent,
              spec: { ...result } as AppSpec,
              rawLines: [...rawLines],
            });
          }
        }
      }
    }

    // Flush any remaining buffer in the compiler
    const finalSpec = compiler.getResult() as AppSpec;

    onProgress?.({
      phase: "done",
      thinkingContent,
      spec: finalSpec,
      rawLines,
    });

    // Check if the compiler produced a non-empty spec
    if (finalSpec.root) {
      return {
        status: "success",
        spec: finalSpec,
        rawJson: JSON.stringify(finalSpec, null, 2),
        systemPrompt,
      };
    }

    // Fallback: LLM may have output a complete JSON object instead of JSONL patches.
    // Try parsing the accumulated raw content as a single JSON spec.
    if (rawContent.trim()) {
      try {
        const parsed = JSON.parse(rawContent);
        const result = catalog.validate(parsed);
        if (result.success) {
          return {
            status: "success",
            spec: result.data as AppSpec,
            rawJson: JSON.stringify(parsed, null, 2),
            systemPrompt,
          };
        }
      } catch {
        // Not valid JSON either — fall through to error
      }
    }

    return {
      status: "error",
      rawResponse: rawContent || thinkingContent.slice(0, 500),
      error: rawContent
        ? `LLM output was not parseable as JSONL patches or a complete JSON spec:\n${rawContent.slice(0, 1000)}`
        : thinkingContent
          ? `Model produced thinking but no content output (${thinkingContent.length} chars of thinking).`
          : "Ollama returned an empty response.",
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
