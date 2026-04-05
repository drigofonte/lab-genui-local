import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog";
import { Metric } from "./components/Metric";
import { BarGraph } from "./components/BarGraph";

export const { registry } = defineRegistry(catalog, {
  components: {
    // From @json-render/shadcn
    Card: shadcnComponents.Card,
    Table: shadcnComponents.Table,
    Text: shadcnComponents.Text,
    Heading: shadcnComponents.Heading,
    Stack: shadcnComponents.Stack,
    Grid: shadcnComponents.Grid,
    Badge: shadcnComponents.Badge,
    Separator: shadcnComponents.Separator,

    // Custom components
    Metric,
    BarGraph,
  },
});
