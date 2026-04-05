import { SimpleRenderer } from "@/catalog/simple-renderer";
import type { AppSpec } from "@/catalog/catalog";

interface RenderAreaProps {
  spec: AppSpec | null;
}

export function RenderArea({ spec }: RenderAreaProps) {
  if (!spec) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        Generated UI will appear here
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <SimpleRenderer spec={spec} />
    </div>
  );
}
