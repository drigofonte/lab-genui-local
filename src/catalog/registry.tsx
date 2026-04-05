/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRenderer } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog";
import { Metric } from "./components/Metric";
import { BarGraph } from "./components/BarGraph";

/**
 * createRenderer passes props flat: (flatProps) => JSX
 * shadcn components expect: ({ props, children, emit, on }) => JSX
 *
 * This wrapper bridges the two formats at runtime.
 * Type casts are needed because the two APIs have incompatible signatures.
 */
function wrapShadcn(component: any): any {
  return (flatProps: any) => {
    const { children, ...rest } = flatProps;
    return component({ props: rest, children, emit: () => {}, on: {} });
  };
}

export const AppRenderer = createRenderer(catalog, {
  Card: wrapShadcn(shadcnComponents.Card),
  Table: wrapShadcn(shadcnComponents.Table),
  Text: wrapShadcn(shadcnComponents.Text),
  Heading: wrapShadcn(shadcnComponents.Heading),
  Stack: wrapShadcn(shadcnComponents.Stack),
  Grid: wrapShadcn(shadcnComponents.Grid),
  Badge: wrapShadcn(shadcnComponents.Badge),
  Separator: wrapShadcn(shadcnComponents.Separator),
  Metric: wrapShadcn(Metric),
  BarGraph: wrapShadcn(BarGraph),
});
