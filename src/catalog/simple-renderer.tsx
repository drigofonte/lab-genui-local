import type { AppSpec } from "./catalog";
import { Metric } from "./components/Metric";
import { BarGraph } from "./components/BarGraph";

/**
 * Simple spec renderer that bypasses json-render's createRenderer/Renderer.
 *
 * createRenderer has prop-passing incompatibilities with @json-render/shadcn
 * components (flat props vs { props } wrapper). This renderer reads the spec
 * directly and renders components with the correct prop shape.
 */

// Simple shadcn-style components for layout (no dependency on @json-render/shadcn)
function Card({ props, children }: { props: any; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {(props.title || props.description) && (
        <div className="flex flex-col space-y-1.5 p-6 pb-0">
          {props.title && <h3 className="text-2xl font-semibold leading-none tracking-tight">{props.title}</h3>}
          {props.description && <p className="text-sm text-muted-foreground">{props.description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

function Stack({ props, children }: { props: any; children?: React.ReactNode }) {
  const isHorizontal = props.direction === "horizontal";
  const gapMap: Record<string, string> = { none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8" };
  const gap = gapMap[props.gap ?? "md"] ?? "gap-4";
  return (
    <div className={`flex ${isHorizontal ? "flex-row" : "flex-col"} ${gap}`}>
      {children}
    </div>
  );
}

function Grid({ props, children }: { props: any; children?: React.ReactNode }) {
  const cols = props.columns ?? 1;
  const gapMap: Record<string, string> = { sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8" };
  const gap = gapMap[props.gap ?? "md"] ?? "gap-4";
  const colsMap: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6" };
  return <div className={`grid ${colsMap[cols] ?? "grid-cols-1"} ${gap}`}>{children}</div>;
}

function Heading({ props }: { props: any }) {
  const level = props.level ?? "h2";
  const sizeMap: Record<string, string> = { h1: "text-4xl", h2: "text-3xl", h3: "text-2xl", h4: "text-xl" };
  const className = `font-bold tracking-tight ${sizeMap[level] ?? "text-2xl"}`;
  if (level === "h1") return <h1 className={className}>{props.text}</h1>;
  if (level === "h3") return <h3 className={className}>{props.text}</h3>;
  if (level === "h4") return <h4 className={className}>{props.text}</h4>;
  return <h2 className={className}>{props.text}</h2>;
}

function Text({ props }: { props: any }) {
  return <p className="text-sm text-muted-foreground">{props.text}</p>;
}

function Badge({ props }: { props: any }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      {props.text}
    </span>
  );
}

function Table({ props }: { props: any }) {
  const columns: string[] = props.columns ?? [];
  const rows: string[][] = props.rows ?? [];
  return (
    <div className="rounded-md border">
      <table className="w-full caption-bottom text-sm">
        {props.caption && <caption className="mt-4 text-sm text-muted-foreground">{props.caption}</caption>}
        <thead className="[&_tr]:border-b">
          <tr className="border-b">
            {columns.map((col: string, i: number) => (
              <th key={i} className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {rows.map((row: string[], ri: number) => (
            <tr key={ri} className="border-b">
              {row.map((cell: string, ci: number) => (
                <td key={ci} className="p-4 align-middle">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Separator() {
  return <div className="shrink-0 bg-border h-[1px] w-full" />;
}

const COMPONENTS: Record<string, React.ComponentType<{ props: any; children?: React.ReactNode }>> = {
  Card,
  Stack,
  Grid,
  Heading,
  Text,
  Badge,
  Table,
  Separator,
  Metric: Metric as any,
  BarGraph: BarGraph as any,
};

function RenderElement({ spec, elementKey }: { spec: AppSpec; elementKey: string }) {
  const element = (spec.elements as any)[elementKey];
  if (!element) return null;

  const Component = COMPONENTS[element.type];
  if (!Component) {
    return <div className="text-sm text-destructive">Unknown component: {element.type}</div>;
  }

  const childNodes = (element.children ?? []).map((childKey: string) => (
    <RenderElement key={childKey} spec={spec} elementKey={childKey} />
  ));

  return (
    <Component props={element.props ?? {}}>
      {childNodes.length > 0 ? childNodes : undefined}
    </Component>
  );
}

export function SimpleRenderer({ spec }: { spec: AppSpec }) {
  if (!spec.root) return null;
  return <RenderElement spec={spec} elementKey={spec.root} />;
}
