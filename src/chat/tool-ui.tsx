import { useEffect, useRef } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import type { AppSpec } from "@/catalog/catalog";

type RenderUIArgs = {
  spec: AppSpec;
};

/**
 * Tool UI that syncs the generated spec to the center panel preview.
 *
 * Does NOT render the spec inline in the assistant message — the
 * center panel is the canonical render surface. The chat message
 * shows a text status ("Generating UI..." → "Generating UI... done")
 * via the adapter's buildResult function instead.
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

  // Render nothing visible — the center panel shows the spec
  return null;
}
