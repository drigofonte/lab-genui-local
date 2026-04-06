import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn";
import { z } from "zod";

/**
 * Component catalog: Every Layout primitives for layout,
 * shadcn for data/content, custom for domain-specific.
 *
 * Layout primitives accept CSS-length strings (Utopia tokens)
 * for intrinsic, fluid spacing.
 */
export const catalog = defineCatalog(schema, {
  actions: {},
  components: {
    // --- Layout primitives (Every Layout) ---
    Stack: {
      props: z.object({
        space: z.string().nullable(),
        recursive: z.boolean().nullable(),
        splitAfter: z.number().nullable(),
      }),
      description:
        "Vertical flow with consistent spacing between children. Use for any vertical list of elements.",
      example: { space: "var(--space-m)", recursive: null, splitAfter: null },
    },

    Box: {
      props: z.object({
        padding: z.string().nullable(),
        borderWidth: z.string().nullable(),
      }),
      description:
        "A padded container with optional border. Use to visually group content with consistent inset.",
      example: { padding: "var(--space-m)", borderWidth: null },
    },

    Center: {
      props: z.object({
        maxWidth: z.string().nullable(),
        centerText: z.boolean().nullable(),
        gutters: z.string().nullable(),
        intrinsic: z.boolean().nullable(),
      }),
      description:
        "Horizontally center content with a max-width constraint. Use for readable text columns or centered layouts.",
      example: { maxWidth: "60ch", centerText: null, gutters: null, intrinsic: null },
    },

    Cluster: {
      props: z.object({
        space: z.string().nullable(),
        justify: z.string().nullable(),
        align: z.string().nullable(),
      }),
      description:
        "Horizontal row of items that wraps naturally. Use for tags, badges, buttons, or any inline group.",
      example: { space: "var(--space-s)", justify: null, align: null },
    },

    Sidebar: {
      props: z.object({
        side: z.enum(["left", "right"]).nullable(),
        sideWidth: z.string().nullable(),
        contentMin: z.string().nullable(),
        space: z.string().nullable(),
      }),
      description:
        "Two-panel layout — sidebar has fixed ideal width, content fills remaining space. Wraps to stacked on narrow screens. Expects exactly two children.",
      example: { side: "left", sideWidth: "20rem", contentMin: "50%", space: "var(--space-l)" },
    },

    Switcher: {
      props: z.object({
        threshold: z.string().nullable(),
        space: z.string().nullable(),
        limit: z.number().nullable(),
      }),
      description:
        "Equal-width row that automatically stacks when container is too narrow. Use instead of Grid when all items should be equal width.",
      example: { threshold: "30rem", space: "var(--space-m)", limit: 4 },
    },

    Cover: {
      props: z.object({
        minHeight: z.string().nullable(),
        space: z.string().nullable(),
        noPad: z.boolean().nullable(),
      }),
      description:
        "Vertically center a principal element within a minimum-height container. Use for hero sections or full-page layouts.",
      example: { minHeight: "100vh", space: "var(--space-m)", noPad: null },
    },

    Grid: {
      props: z.object({
        min: z.string().nullable(),
        space: z.string().nullable(),
      }),
      description:
        "Responsive grid that auto-fills columns based on a minimum item width. Use for card grids, galleries, or dashboard panels.",
      example: { min: "250px", space: "var(--space-m)" },
    },

    Frame: {
      props: z.object({
        ratio: z.string().nullable(),
      }),
      description:
        "Constrain media to a fixed aspect ratio. Use for images, videos, or embedded content.",
      example: { ratio: "16 / 9" },
    },

    Reel: {
      props: z.object({
        itemWidth: z.string().nullable(),
        space: z.string().nullable(),
        height: z.string().nullable(),
        noBar: z.boolean().nullable(),
      }),
      description:
        "Horizontal scrolling container for overflow content. Use for carousels, image strips, or horizontal lists.",
      example: { itemWidth: "20ch", space: "var(--space-s)", height: null, noBar: null },
    },

    // --- Data/content components (shadcn) ---
    Card: shadcnComponentDefinitions.Card,
    Table: shadcnComponentDefinitions.Table,
    Text: shadcnComponentDefinitions.Text,
    Heading: shadcnComponentDefinitions.Heading,
    Badge: shadcnComponentDefinitions.Badge,
    Separator: shadcnComponentDefinitions.Separator,

    // --- Domain-specific ---
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
