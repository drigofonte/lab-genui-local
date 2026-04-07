import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarGraph } from "./BarGraph";
import { Stack } from "../../components/layout";

const meta = {
  title: "Data/BarGraph",
  component: BarGraph,
  tags: ["autodocs"],
  argTypes: {
    props: { control: "object" },
  },
} satisfies Meta<typeof BarGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    props: {
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
};

export const Playground: Story = {
  args: {
    props: {
      title: "Monthly Revenue",
      data: [
        { label: "Jan", value: 45 },
        { label: "Feb", value: 52 },
        { label: "Mar", value: 61 },
        { label: "Apr", value: 48 },
        { label: "May", value: 73 },
      ],
      color: "oklch(0.577 0.245 27.325)",
    },
  },
};

export const Composition: Story = {
  name: "Stack of BarGraphs",
  render: () => (
    <Stack space="var(--space-l)">
      <BarGraph
        props={{
          title: "Q1 Performance",
          data: [
            { label: "Revenue", value: 120 },
            { label: "Expenses", value: 85 },
            { label: "Profit", value: 35 },
          ],
          color: null,
        }}
      />
      <BarGraph
        props={{
          title: "Q2 Performance",
          data: [
            { label: "Revenue", value: 145 },
            { label: "Expenses", value: 90 },
            { label: "Profit", value: 55 },
          ],
          color: null,
        }}
      />
    </Stack>
  ),
};
