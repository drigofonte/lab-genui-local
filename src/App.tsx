import { useState, useCallback } from "react";
import { OllamaRuntimeProvider } from "@/chat/ollama-runtime";
import { createRenderUIToolUI } from "@/chat/tool-ui";
import { Thread } from "@/components/assistant-ui/thread";
import { AppSidebar } from "@/components/AppSidebar";
import { RenderArea } from "@/components/RenderArea";
import { DebugPanel } from "@/components/DebugPanel";
import { Sidebar } from "@/components/layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AppSpec } from "@/catalog/catalog";

function App() {
  const [spec, setSpec] = useState<AppSpec | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);

  const handleSpecUpdate = useCallback((newSpec: AppSpec) => {
    setSpec(newSpec);
    setDiagOpen(true);
  }, []);

  // Create the tool UI component with the spec update callback
  const RenderUIToolUI = createRenderUIToolUI(handleSpecUpdate);

  return (
    <OllamaRuntimeProvider>
      <TooltipProvider>
        <RenderUIToolUI />
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          {/* Left sidebar — icon rail placeholder */}
          <AppSidebar />

          {/* Center + Right panels */}
          <Sidebar
            side="right"
            sideWidth="380px"
            contentMin="40%"
            space="0px"
            className="flex-1 min-w-0"
          >
            {/* Center: rendered UI + diagnostics */}
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <RenderArea spec={spec} />
              </div>

              {/* Collapsible diagnostics panel */}
              <div className="border-t">
                <button
                  type="button"
                  onClick={() => setDiagOpen((o) => !o)}
                  className="flex w-full items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
                >
                  <span
                    className="transition-transform"
                    style={{
                      transform: diagOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    &#9654;
                  </span>
                  Diagnostics
                </button>
                {diagOpen && (
                  <div className="h-64 overflow-hidden border-t">
                    <DebugPanel />
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: chat thread */}
            <div className="h-full border-l">
              <Thread />
            </div>
          </Sidebar>
        </div>
      </TooltipProvider>
    </OllamaRuntimeProvider>
  );
}

export default App;
