/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppSpec } from "./catalog";
import { Metric } from "./components/Metric";
import { BarGraph } from "./components/BarGraph";
import {
  Stack as LayoutStack,
  Box as LayoutBox,
  Center as LayoutCenter,
  Cluster as LayoutCluster,
  Sidebar as LayoutSidebar,
  Switcher as LayoutSwitcher,
  Cover as LayoutCover,
  Grid as LayoutGrid,
  Frame as LayoutFrame,
  Reel as LayoutReel,
} from "../components/layout";

/**
 * Simple spec renderer that bypasses json-render's createRenderer/Renderer.
 *
 * createRenderer has prop-passing incompatibilities with @json-render/shadcn
 * components (flat props vs { props } wrapper). This renderer reads the spec
 * directly and renders components with the correct prop shape.
 */

// --- Every Layout wrappers (bridge { props, children } to flat-prop components) ---
// Null coalescing (?? undefined) ensures null values from the catalog schema
// fall through to component parameter defaults instead of overriding them.
function Stack({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutStack space={props.space ?? undefined} recursive={props.recursive ?? undefined} splitAfter={props.splitAfter ?? undefined}>{children}</LayoutStack>;
}

function Box({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutBox padding={props.padding ?? undefined} borderWidth={props.borderWidth ?? undefined}>{children}</LayoutBox>;
}

function Center({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutCenter maxWidth={props.maxWidth ?? undefined} centerText={props.centerText ?? undefined} gutters={props.gutters ?? undefined} intrinsic={props.intrinsic ?? undefined}>{children}</LayoutCenter>;
}

function Cluster({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutCluster space={props.space ?? undefined} justify={props.justify ?? undefined} align={props.align ?? undefined}>{children}</LayoutCluster>;
}

function Sidebar({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutSidebar side={props.side ?? undefined} sideWidth={props.sideWidth ?? undefined} contentMin={props.contentMin ?? undefined} space={props.space ?? undefined}>{children}</LayoutSidebar>;
}

function Switcher({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutSwitcher threshold={props.threshold ?? undefined} space={props.space ?? undefined} limit={props.limit ?? undefined}>{children}</LayoutSwitcher>;
}

function Cover({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutCover minHeight={props.minHeight ?? undefined} space={props.space ?? undefined} noPad={props.noPad ?? undefined}>{children}</LayoutCover>;
}

function Grid({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutGrid min={props.min ?? undefined} space={props.space ?? undefined}>{children}</LayoutGrid>;
}

function Frame({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutFrame ratio={props.ratio ?? undefined}>{children}</LayoutFrame>;
}

function Reel({ props, children }: { props: any; children?: React.ReactNode }) {
  return <LayoutReel itemWidth={props.itemWidth ?? undefined} space={props.space ?? undefined} height={props.height ?? undefined} noBar={props.noBar ?? undefined}>{children}</LayoutReel>;
}

// --- Data/content components ---
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

function Heading({ props }: { props: any }) {
  const level = props.level ?? "h2";
  const text = typeof props.text === "string" ? props.text : JSON.stringify(props.text);
  const sizeMap: Record<string, string> = { h1: "text-4xl", h2: "text-3xl", h3: "text-2xl", h4: "text-xl" };
  const className = `font-bold tracking-tight ${sizeMap[level] ?? "text-2xl"}`;
  if (level === "h1") return <h1 className={className}>{text}</h1>;
  if (level === "h3") return <h3 className={className}>{text}</h3>;
  if (level === "h4") return <h4 className={className}>{text}</h4>;
  return <h2 className={className}>{text}</h2>;
}

function Text({ props }: { props: any }) {
  const text = typeof props.text === "string" ? props.text : JSON.stringify(props.text);
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function Badge({ props }: { props: any }) {
  const text = typeof props.text === "string" ? props.text : JSON.stringify(props.text);
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      {text}
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
  // Layout primitives
  Stack,
  Box,
  Center,
  Cluster,
  Sidebar,
  Switcher,
  Cover,
  Grid,
  Frame,
  Reel,
  // Data/content
  Card,
  Heading,
  Text,
  Badge,
  Table,
  Separator,
  Metric: Metric as any,
  BarGraph: BarGraph as any,
};

function RenderElement({ spec, elementKey }: { spec: AppSpec; elementKey: string }) {
  const elements = spec.elements as Record<string, any> | undefined;
  if (!elements) return null;
  const element = elements[elementKey];
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
  const elements = spec.elements as Record<string, any> | undefined;
  if (!elements) return null;

  // If root key exists in elements, use it directly
  if (elements[spec.root]) {
    return <RenderElement spec={spec} elementKey={spec.root} />;
  }

  // Fallback: LLM sometimes generates a root key that doesn't match any
  // element key. Find elements not referenced as children — those are
  // top-level elements the LLM forgot to wrap in a parent.
  const allChildKeys = new Set<string>();
  for (const el of Object.values(elements)) {
    for (const childKey of el.children ?? []) {
      allChildKeys.add(childKey);
    }
  }
  const orphanKeys = Object.keys(elements).filter((k) => !allChildKeys.has(k));

  if (orphanKeys.length === 1) {
    return <RenderElement spec={spec} elementKey={orphanKeys[0]} />;
  }

  // Multiple orphans: render them all in a Stack (the LLM likely intended
  // a parent wrapper but forgot to create it)
  if (orphanKeys.length > 1) {
    return (
      <div className="stack" style={{ "--space": "var(--space-m)" } as React.CSSProperties}>
        {orphanKeys.map((key) => (
          <RenderElement key={key} spec={spec} elementKey={key} />
        ))}
      </div>
    );
  }

  return null;
}
