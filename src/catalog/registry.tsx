/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRenderer } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog";
import { Metric } from "./components/Metric";
import { BarGraph } from "./components/BarGraph";

// The shadcn components use BaseComponentProps<P> (wrapping props in { props: P })
// while createRenderer expects ComponentRenderProps<P> (flat props).
// These are structurally compatible at runtime — the type system is overly strict here.
export const AppRenderer = createRenderer(catalog, {
  Card: shadcnComponents.Card as any,
  Table: shadcnComponents.Table as any,
  Text: shadcnComponents.Text as any,
  Heading: shadcnComponents.Heading as any,
  Stack: shadcnComponents.Stack as any,
  Grid: shadcnComponents.Grid as any,
  Badge: shadcnComponents.Badge as any,
  Separator: shadcnComponents.Separator as any,
  Metric: Metric as any,
  BarGraph: BarGraph as any,
});
