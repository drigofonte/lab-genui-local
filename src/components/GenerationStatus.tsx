import { useDiagnostics } from "@/chat/diagnostics-context";
import { Loader2 } from "lucide-react";

/**
 * Shows generation status in the center panel so users know
 * something is happening even when the diagnostics panel is collapsed.
 */
export function GenerationStatus() {
  const { isGenerating, thinkingContent, rawLines } = useDiagnostics();

  if (!isGenerating) return null;

  const hasPatches = rawLines.length > 0;
  const isThinking = thinkingContent.length > 0;

  let label: string;
  if (hasPatches) {
    label = "Generating UI...";
  } else if (isThinking) {
    label = "Thinking...";
  } else {
    label = "Connecting to model...";
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <span>{label}</span>
      {hasPatches && (
        <span className="text-xs text-muted-foreground/60">
          ({rawLines.length} {rawLines.length === 1 ? "patch" : "patches"})
        </span>
      )}
    </div>
  );
}
