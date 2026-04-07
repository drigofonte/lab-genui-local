import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAutoScroll } from "@/hooks/useAutoScroll";

interface DebugPanelProps {
  rawJson: string | null;
  error: string | null;
  systemPrompt: string | null;
  /** Live JSONL lines during streaming */
  streamLines: string[] | null;
  thinkingContent: string | null;
}

export function DebugPanel({ rawJson, error, systemPrompt, streamLines, thinkingContent }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState("json");
  const [hasEverHadThinking, setHasEverHadThinking] = useState(false);
  const isStreaming = streamLines !== null && streamLines.length > 0;

  useEffect(() => {
    if (thinkingContent && thinkingContent.length > 0) {
      setHasEverHadThinking(true);
    }
  }, [thinkingContent]);

  // During streaming show JSONL lines; after completion show formatted JSON
  const jsonDisplay = isStreaming
    ? streamLines.join("\n")
    : rawJson;

  const jsonScrollRef = useAutoScroll<HTMLPreElement>(jsonDisplay);
  const thinkingScrollRef = useAutoScroll<HTMLPreElement>(thinkingContent);

  return (
    <div className="rounded-lg border bg-card">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
          <TabsTrigger value="json" className="text-xs">
            {isStreaming ? "JSONL Patches" : "Raw JSON"}
            {isStreaming && (
              <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            )}
          </TabsTrigger>
          {hasEverHadThinking && (
            <TabsTrigger value="thinking" className="text-xs">
              Thinking
            </TabsTrigger>
          )}
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

        <TabsContent value="json" className="p-3">
          {jsonDisplay ? (
            <pre ref={jsonScrollRef} className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs font-mono">
              {jsonDisplay}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              No response yet. Generate a UI to see the raw output.
            </p>
          )}
        </TabsContent>

        {hasEverHadThinking && (
          <TabsContent value="thinking" className="p-3">
            {thinkingContent ? (
              <pre ref={thinkingScrollRef} className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs font-mono text-muted-foreground">
                {thinkingContent}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                No thinking output for this generation.
              </p>
            )}
          </TabsContent>
        )}

        <TabsContent value="errors" className="p-3">
          {error ? (
            <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs font-mono text-destructive">
              {error}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No errors.</p>
          )}
        </TabsContent>

        <TabsContent value="prompt" className="p-3">
          {systemPrompt ? (
            <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs font-mono">
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
