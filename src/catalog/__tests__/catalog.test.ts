import { describe, it, expect } from "vitest";
import { catalog } from "../catalog";

describe("catalog", () => {
  it("prompt() contains all layout primitive and data component names", () => {
    const prompt = catalog.prompt();
    expect(prompt.length).toBeGreaterThan(0);

    const expectedComponents = [
      // Layout primitives
      "Stack",
      "Box",
      "Center",
      "Cluster",
      "Sidebar",
      "Switcher",
      "Cover",
      "Grid",
      "Frame",
      "Reel",
      // Data/content
      "Card",
      "Table",
      "Text",
      "Heading",
      "Badge",
      "Separator",
      "Metric",
      "BarGraph",
    ];

    for (const name of expectedComponents) {
      expect(prompt).toContain(name);
    }
  });

  it("validate() accepts a well-formed spec with Metric", () => {
    const spec = {
      root: "metric-1",
      elements: {
        "metric-1": {
          type: "Metric",
          props: {
            label: "Revenue",
            value: "$1.2M",
            description: null,
            trend: "up",
          },
          children: [],
        },
      },
    };

    const result = catalog.validate(spec);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error?.issues, null, 2));
    }
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("validate() accepts a spec using Sidebar with string props", () => {
    const spec = {
      root: "sidebar-1",
      elements: {
        "sidebar-1": {
          type: "Sidebar",
          props: {
            side: "left",
            sideWidth: "15rem",
            contentMin: "60%",
            space: "var(--space-l)",
          },
          children: ["nav-1", "main-1"],
        },
        "nav-1": {
          type: "Stack",
          props: { space: "var(--space-s)", recursive: null, splitAfter: null },
          children: [],
        },
        "main-1": {
          type: "Heading",
          props: { text: "Dashboard", level: "h1" },
          children: [],
        },
      },
    };

    const result = catalog.validate(spec);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error?.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("validate() accepts a minimal Center + Heading spec", () => {
    const spec = {
      root: "center-1",
      elements: {
        "center-1": {
          type: "Center",
          props: { maxWidth: "40ch", centerText: null, gutters: null, intrinsic: null },
          children: ["heading-1"],
        },
        "heading-1": {
          type: "Heading",
          props: { text: "Welcome", level: "h1" },
          children: [],
        },
      },
    };

    const result = catalog.validate(spec);
    expect(result.success).toBe(true);
  });

  it("validate() accepts specs for all remaining layout components", () => {
    const specs = [
      { type: "Box", props: { padding: "var(--space-m)", borderWidth: null } },
      { type: "Cluster", props: { space: "var(--space-s)", justify: null, align: null } },
      { type: "Switcher", props: { threshold: "30rem", space: null, limit: 3 } },
      { type: "Cover", props: { minHeight: "50vh", space: null, noPad: null } },
      { type: "Grid", props: { min: "250px", space: null } },
      { type: "Frame", props: { ratio: "16 / 9" } },
      { type: "Reel", props: { itemWidth: "20ch", space: null, height: null, noBar: null } },
    ];

    for (const { type, props } of specs) {
      const spec = {
        root: "el-1",
        elements: {
          "el-1": { type, props, children: [] },
        },
      };
      const result = catalog.validate(spec);
      if (!result.success) {
        console.error(`${type} validation errors:`, JSON.stringify(result.error?.issues, null, 2));
      }
      expect(result.success).toBe(true);
    }
  });

  it("validate() accepts specs for data components", () => {
    const specs = [
      { type: "Card", props: { title: "Test", description: null } },
      { type: "Text", props: { text: "Hello" } },
      { type: "Badge", props: { text: "Active" } },
      { type: "Separator", props: {} },
    ];

    for (const { type, props } of specs) {
      const spec = {
        root: "el-1",
        elements: {
          "el-1": { type, props, children: [] },
        },
      };
      const result = catalog.validate(spec);
      if (!result.success) {
        console.error(`${type} validation errors:`, JSON.stringify(result.error?.issues, null, 2));
      }
      expect(result.success).toBe(true);
    }
  });

  it("validate() rejects a spec with unknown component type", () => {
    const spec = {
      root: "el-1",
      elements: {
        "el-1": {
          type: "NonExistent",
          props: {},
          children: [],
        },
      },
    };

    const result = catalog.validate(spec);
    expect(result.success).toBe(false);
  });
});
