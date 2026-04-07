import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../../components/layout";

// Inline Table matching the SimpleRenderer version
function Table({ props }: { props: { columns: string[]; rows: string[][]; caption?: string } }) {
  const columns = props.columns ?? [];
  const rows = props.rows ?? [];
  return (
    <div className="rounded-md border">
      <table className="w-full caption-bottom text-sm">
        {props.caption && <caption className="mt-4 text-sm text-muted-foreground">{props.caption}</caption>}
        <thead className="[&_tr]:border-b">
          <tr className="border-b">
            {columns.map((col, i) => (
              <th key={i} className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b">
              {row.map((cell, ci) => (
                <td key={ci} className="p-4 align-middle">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: "Data/Table",
  component: Table,
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    props: {
      columns: ["Name", "Role", "Status"],
      rows: [
        ["Alice", "Engineer", "Active"],
        ["Bob", "Designer", "Active"],
        ["Carol", "PM", "On Leave"],
      ],
    },
  },
};

export const Playground: Story = {
  args: {
    props: {
      caption: "Team roster as of Q2 2026",
      columns: ["Name", "Department", "Location", "Tenure"],
      rows: [
        ["Alice", "Engineering", "London", "3 years"],
        ["Bob", "Design", "Berlin", "1 year"],
        ["Carol", "Product", "NYC", "5 years"],
      ],
    },
  },
};

export const Composition: Story = {
  name: "Tables in a Stack",
  render: () => (
    <Stack space="var(--space-l)">
      <h3 style={{ fontSize: "var(--step-1)" }}>Q1 Results</h3>
      <Table
        props={{
          columns: ["Metric", "Value"],
          rows: [
            ["Revenue", "$1.2M"],
            ["Expenses", "$850K"],
            ["Profit", "$350K"],
          ],
        }}
      />
      <h3 style={{ fontSize: "var(--step-1)" }}>Q2 Results</h3>
      <Table
        props={{
          columns: ["Metric", "Value"],
          rows: [
            ["Revenue", "$1.5M"],
            ["Expenses", "$920K"],
            ["Profit", "$580K"],
          ],
        }}
      />
    </Stack>
  ),
};
