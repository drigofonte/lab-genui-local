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
});
