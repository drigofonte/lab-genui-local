import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { StreamProgress } from "@/adapter/ollama";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  progress: StreamProgress | null;
}

const phaseLabels: Record<string, string> = {
  connecting: "Connecting to Ollama...",
  thinking: "Thinking...",
  generating: "Generating UI...",
  done: "Finishing...",
};

export function PromptInput({ onGenerate, isLoading, progress }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim());
    }
  }

  const statusLabel = progress ? phaseLabels[progress.phase] ?? "Working..." : null;

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Describe the UI you want, e.g. "Show me a dashboard with Q1 sales by region"'
          className="min-h-[60px] flex-1 resize-none"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={isLoading || !prompt.trim()}>
          {isLoading ? "Stop" : "Generate"}
        </Button>
      </form>
      {isLoading && statusLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          {statusLabel}
          {progress?.phase === "thinking" && progress.thinkingContent.length > 0 && (
            <span className="text-xs">({progress.thinkingContent.length} chars)</span>
          )}
          {progress?.phase === "generating" && progress.generatedContent.length > 0 && (
            <span className="text-xs">({progress.generatedContent.length} chars)</span>
          )}
        </div>
      )}
    </div>
  );
}
