import { useEffect, useRef } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import type { AppSpec } from "@/catalog/catalog";

type RenderUIArgs = {
  spec: AppSpec;
};

/**
 * Tool UI that syncs the generated spec to the center panel preview.
 *
 * During streaming (status "running"), shows "Generating UI…" with a
 * pulsing indicator. Once complete, renders nothing — the center panel
 * is the canonical render surface.
 */
export function createRenderUIToolUI(onSpecUpdate?: (spec: AppSpec) => void) {
  return makeAssistantToolUI<RenderUIArgs, undefined>({
    toolName: "render_ui",
    render: ({ args, status }) => {
      return (
        <RenderUISync
          spec={args?.spec}
          isComplete={status.type === "complete"}
          onSpecUpdate={onSpecUpdate}
        />
      );
    },
  });
}

function RenderUISync({
  spec,
  isComplete,
  onSpecUpdate,
}: {
  spec: AppSpec | undefined;
  isComplete: boolean;
  onSpecUpdate?: (spec: AppSpec) => void;
}) {
  const callbackRef = useRef(onSpecUpdate);
  callbackRef.current = onSpecUpdate;

  useEffect(() => {
    if (spec) {
      callbackRef.current?.(spec);
    }
  }, [spec]);

  if (isComplete) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
      <span className="inline-block size-2 animate-pulse rounded-full bg-foreground" />
      Generating UI…
    </div>
  );
}
