import { useState, useCallback } from "react";
import { OllamaRuntimeProvider } from "@/chat/ollama-runtime";
import { createRenderUIToolUI } from "@/chat/tool-ui";
import { Thread } from "@/components/assistant-ui/thread";
import { AppSidebar } from "@/components/AppSidebar";
import { RenderArea } from "@/components/RenderArea";
import { DebugPanel } from "@/components/DebugPanel";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Sidebar } from "@/components/layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { AppSpec } from "@/catalog/catalog";

function App() {
  const [spec, setSpec] = useState<AppSpec | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const handleSpecUpdate = useCallback((newSpec: AppSpec) => {
    setSpec(newSpec);
    setDiagOpen(true);
    // On mobile, switch to preview tab when spec first arrives
    setMobileTab("preview");
  }, []);

  const RenderUIToolUI = createRenderUIToolUI(handleSpecUpdate);

  if (isMobile) {
    return (
      <OllamaRuntimeProvider>
        <TooltipProvider>
          <RenderUIToolUI />
          <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
            <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />

            {mobileTab === "chat" ? (
              <div className="flex-1 overflow-hidden">
                <Thread />
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4">
                  <GenerationStatus />
                  <RenderArea spec={spec} />
                </div>
                <DiagnosticsToggle
                  open={diagOpen}
                  onToggle={() => setDiagOpen((o) => !o)}
                />
              </div>
            )}
          </div>
        </TooltipProvider>
      </OllamaRuntimeProvider>
    );
  }

  return (
    <OllamaRuntimeProvider>
      <TooltipProvider>
        <RenderUIToolUI />
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <AppSidebar />

          <Sidebar
            side="right"
            sideWidth="380px"
            contentMin="40%"
            space="0px"
            className="flex-1 min-w-0"
          >
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <RenderArea spec={spec} />
              </div>
              <DiagnosticsToggle
                open={diagOpen}
                onToggle={() => setDiagOpen((o) => !o)}
              />
            </div>

            <div className="h-full border-l">
              <Thread />
            </div>
          </Sidebar>
        </div>
      </TooltipProvider>
    </OllamaRuntimeProvider>
  );
}

function DiagnosticsToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
      >
        <span
          className="transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          &#9654;
        </span>
        Diagnostics
      </button>
      {open && (
        <div className="h-64 overflow-hidden border-t">
          <DebugPanel />
        </div>
      )}
    </div>
  );
}

export default App;
