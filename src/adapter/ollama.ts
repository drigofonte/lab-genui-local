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

export async function generateUI(prompt: string): Promise<GenerationResult> {
  const systemPrompt = catalog.prompt();
  const sampleDataContext = formatSampleDataForPrompt();
  const userMessage = `${prompt}\n\n${sampleDataContext}`;

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
        stream: false,
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

    const data = await response.json();
    const rawContent: string = data.message?.content ?? "";

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return {
        status: "error",
        rawResponse: rawContent,
        error: `Failed to parse JSON from LLM response: ${rawContent.slice(0, 200)}`,
        systemPrompt,
      };
    }

    // Validate against catalog schema
    const result = catalog.validate(parsed);
    if (result.success) {
      return {
        status: "success",
        spec: result.data!,
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
