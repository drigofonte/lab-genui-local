import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface DebugPanelProps {
  rawJson: string | null;
  error: string | null;
  systemPrompt: string | null;
  streamContent: string | null;
  thinkingContent: string | null;
}

export function DebugPanel({ rawJson, error, systemPrompt, streamContent, thinkingContent }: DebugPanelProps) {
  // Show streaming content while generating, final JSON when done
  const jsonDisplay = streamContent || rawJson;
  const hasThinking = thinkingContent && thinkingContent.length > 0;

  return (
    <div className="rounded-lg border bg-card">
      <Tabs defaultValue="json" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
          <TabsTrigger value="json" className="text-xs">
            Raw JSON
            {streamContent && (
              <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            )}
          </TabsTrigger>
          {hasThinking && (
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
            <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs font-mono">
              {jsonDisplay}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              No response yet. Generate a UI to see the raw JSON.
            </p>
          )}
        </TabsContent>

        {hasThinking && (
          <TabsContent value="thinking" className="p-3">
            <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs font-mono text-muted-foreground">
              {thinkingContent}
            </pre>
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
