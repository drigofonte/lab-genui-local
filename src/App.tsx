import { useState, useCallback } from "react";
import { PromptInput } from "@/components/PromptInput";
import { RenderArea } from "@/components/RenderArea";
import { DebugPanel } from "@/components/DebugPanel";
import { generateUI, type GenerationResult, type StreamProgress } from "@/adapter/ollama";
import type { AppSpec } from "@/catalog/catalog";

function App() {
  const [spec, setSpec] = useState<AppSpec | null>(null);
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<StreamProgress | null>(null);

  const handleProgress = useCallback((p: StreamProgress) => {
    setProgress(p);
  }, []);

  async function handleGenerate(prompt: string) {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    const result: GenerationResult = await generateUI(prompt, handleProgress);
    setSystemPrompt(result.systemPrompt);

    if (result.status === "success") {
      setSpec(result.spec);
      setRawJson(result.rawJson);
      setError(null);
    } else {
      setSpec(null);
      setRawJson(result.rawResponse || null);
      setError(result.error);
    }

    setIsLoading(false);
    setProgress(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">GenUI Local</h1>
          <p className="text-sm text-muted-foreground">
            Describe a UI and a local LLM will generate it
          </p>
        </header>

        <div className="mb-6">
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} progress={progress} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Rendered Output
            </h2>
            <RenderArea spec={spec} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Debug
            </h2>
            <DebugPanel
              rawJson={rawJson}
              error={error}
              systemPrompt={systemPrompt}
              streamContent={progress?.generatedContent ?? null}
              thinkingContent={progress?.thinkingContent ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
