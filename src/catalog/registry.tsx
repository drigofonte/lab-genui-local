/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRenderer } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog";
import { Metric } from "./components/Metric";
import { BarGraph } from "./components/BarGraph";
import {
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
} from "../components/layout";

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

function wrapLayout(component: any): any {
  return (flatProps: any) => {
    const { children, ...rest } = flatProps;
    return component({ ...rest, children });
  };
}

export const AppRenderer = createRenderer(catalog, {
  // Layout primitives (Every Layout)
  Stack: wrapLayout(Stack),
  Box: wrapLayout(Box),
  Center: wrapLayout(Center),
  Cluster: wrapLayout(Cluster),
  Sidebar: wrapLayout(Sidebar),
  Switcher: wrapLayout(Switcher),
  Cover: wrapLayout(Cover),
  Grid: wrapLayout(Grid),
  Frame: wrapLayout(Frame),
  Reel: wrapLayout(Reel),
  // Data/content (shadcn)
  Card: wrapShadcn(shadcnComponents.Card),
  Table: wrapShadcn(shadcnComponents.Table),
  Text: wrapShadcn(shadcnComponents.Text),
  Heading: wrapShadcn(shadcnComponents.Heading),
  Badge: wrapShadcn(shadcnComponents.Badge),
  Separator: wrapShadcn(shadcnComponents.Separator),
  Metric: wrapShadcn(Metric),
  BarGraph: wrapShadcn(BarGraph),
});
