import { describe, it, expect } from "vitest";
import { catalog } from "../catalog";

describe("catalog", () => {
  it("prompt() returns a non-empty string containing all 10 component names", () => {
    const prompt = catalog.prompt();
    expect(prompt.length).toBeGreaterThan(0);

    const expectedComponents = [
      "Card",
      "Table",
      "Text",
      "Heading",
      "Stack",
      "Grid",
      "Badge",
      "Separator",
      "Metric",
      "BarGraph",
    ];

    for (const name of expectedComponents) {
      expect(prompt).toContain(name);
    }
  });

  it("validate() accepts a well-formed spec", () => {
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
});
