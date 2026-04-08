import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useDiagnostics } from "@/chat/diagnostics-context";

export function DebugPanel() {
  const { rawJson, error, systemPrompt, rawLines, isGenerating } = useDiagnostics();
  const [activeTab, setActiveTab] = useState("patches");
  const hasPatches = rawLines.length > 0;

  const patchesDisplay = hasPatches ? rawLines.join("\n") : null;

  const patchesScrollRef = useAutoScroll<HTMLPreElement>(patchesDisplay);

  const dot = <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />;

  return (
    <div className="h-full bg-card">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="flex h-full flex-col">
        <TabsList className="w-full shrink-0 justify-start rounded-none border-b bg-transparent px-2">
          <TabsTrigger value="patches" className="text-xs">
            JSONL Patches
            {isGenerating && hasPatches && dot}
          </TabsTrigger>
          <TabsTrigger value="json" className="text-xs">
            Raw JSON
          </TabsTrigger>
          <TabsTrigger value="errors" className="text-xs">
            Errors
            {error && (
              <span className="ml-1 inline-block h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="prompt" className="text-xs">
            System Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patches" className="flex-1 overflow-hidden p-3">
          {hasPatches ? (
            <pre ref={patchesScrollRef} className="h-full overflow-auto whitespace-pre-wrap text-xs font-mono">
              {patchesDisplay}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              No patches yet. Generate a UI to see streaming JSONL output.
            </p>
          )}
        </TabsContent>

        <TabsContent value="json" className="flex-1 overflow-hidden p-3">
          {rawJson ? (
            <pre className="h-full overflow-auto whitespace-pre-wrap text-xs font-mono">
              {rawJson}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isGenerating ? "JSON will appear after generation completes." : "No response yet. Generate a UI to see the raw output."}
            </p>
          )}
        </TabsContent>

        <TabsContent value="errors" className="flex-1 overflow-hidden p-3">
          {error ? (
            <pre className="h-full overflow-auto whitespace-pre-wrap text-xs font-mono text-destructive">
              {error}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No errors.</p>
          )}
        </TabsContent>

        <TabsContent value="prompt" className="flex-1 overflow-hidden p-3">
          {systemPrompt ? (
            <pre className="h-full overflow-auto whitespace-pre-wrap text-xs font-mono">
              {systemPrompt}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              System prompt will appear after first generation.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
