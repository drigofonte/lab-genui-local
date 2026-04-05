/**
 * Hardcoded quarterly sales dataset for the spike.
 * Included as context in the user message so the LLM can reference it.
 */
export const SAMPLE_DATA = {
  name: "Quarterly Sales by Region (2025)",
  description:
    "Sales figures in thousands of dollars for each region across four quarters.",
  columns: ["Region", "Q1", "Q2", "Q3", "Q4", "Total"],
  rows: [
    ["North America", "245", "312", "289", "358", "1204"],
    ["Europe", "187", "203", "221", "245", "856"],
    ["Asia Pacific", "156", "198", "234", "267", "855"],
    ["Latin America", "89", "102", "118", "134", "443"],
    ["Middle East", "67", "78", "85", "92", "322"],
    ["Africa", "34", "42", "48", "56", "180"],
  ],
  summary: {
    totalRevenue: "$3,860K",
    topRegion: "North America ($1,204K)",
    fastestGrowth: "Asia Pacific (+71% Q1 to Q4)",
    totalRegions: 6,
  },
};

export function formatSampleDataForPrompt(): string {
  const header = SAMPLE_DATA.columns.join(" | ");
  const rows = SAMPLE_DATA.rows.map((r) => r.join(" | ")).join("\n");

  return `## Available Data: ${SAMPLE_DATA.name}

${SAMPLE_DATA.description}

${header}
${rows}

Summary:
- Total Revenue: ${SAMPLE_DATA.summary.totalRevenue}
- Top Region: ${SAMPLE_DATA.summary.topRegion}
- Fastest Growth: ${SAMPLE_DATA.summary.fastestGrowth}
- Total Regions: ${SAMPLE_DATA.summary.totalRegions}`;
}
