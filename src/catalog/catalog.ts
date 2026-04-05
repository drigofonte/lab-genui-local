import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn";
import { z } from "zod";

/**
 * Focused 10-component catalog for the spike.
 *
 * Uses shadcn pre-built definitions where available,
 * with custom definitions for Metric and BarGraph.
 */
export const catalog = defineCatalog(schema, {
  actions: {},
  components: {
    // From @json-render/shadcn
    Card: shadcnComponentDefinitions.Card,
    Table: shadcnComponentDefinitions.Table,
    Text: shadcnComponentDefinitions.Text,
    Heading: shadcnComponentDefinitions.Heading,
    Stack: shadcnComponentDefinitions.Stack,
    Grid: shadcnComponentDefinitions.Grid,
    Badge: shadcnComponentDefinitions.Badge,
    Separator: shadcnComponentDefinitions.Separator,

    // Custom components
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        description: z.string().nullable(),
        trend: z.enum(["up", "down", "neutral"]).nullable(),
      }),
      description:
        "Display a single metric/KPI with a label, value, optional description, and optional trend indicator.",
      example: {
        label: "Total Revenue",
        value: "$1.2M",
        description: "+12% from last quarter",
        trend: "up",
      },
    },

    BarGraph: {
      props: z.object({
        title: z.string().nullable(),
        data: z.array(
          z.object({
            label: z.string(),
            value: z.number(),
          })
        ),
        color: z.string().nullable(),
      }),
      description:
        "A simple bar chart. Each data item has a label and a numeric value. Bars are rendered horizontally.",
      example: {
        title: "Sales by Region",
        data: [
          { label: "North", value: 120 },
          { label: "South", value: 85 },
          { label: "East", value: 95 },
          { label: "West", value: 110 },
        ],
        color: null,
      },
    },
  },
});

export type AppSpec = typeof catalog._specType;
