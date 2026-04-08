import { makeAssistantToolUI } from "@assistant-ui/react";
import { SimpleRenderer } from "@/catalog/simple-renderer";
import type { AppSpec } from "@/catalog/catalog";

type RenderUIArgs = {
  spec: AppSpec;
};

/**
 * Tool UI component that renders the generated spec inline in assistant messages.
 *
 * Registered for the "render_ui" tool name. During streaming, `status.type`
 * is "running" and `args.spec` contains the partial spec built so far.
 * When complete, `status.type` is "complete".
 *
 * An optional `onSpecUpdate` callback can be used to sync the spec
 * to an external preview panel (e.g., the center panel in the app shell).
 */
export function createRenderUIToolUI(onSpecUpdate?: (spec: AppSpec) => void) {
  return makeAssistantToolUI<RenderUIArgs, undefined>({
    toolName: "render_ui",
    render: ({ args }) => {
      const spec = args?.spec;

      if (spec) {
        onSpecUpdate?.(spec);
      }

      if (!spec?.root) {
        return (
          <div className="text-sm text-muted-foreground py-2">
            Generating UI...
          </div>
        );
      }

      return (
        <div className="py-2">
          <SimpleRenderer spec={spec} />
        </div>
      );
    },
  });
}
