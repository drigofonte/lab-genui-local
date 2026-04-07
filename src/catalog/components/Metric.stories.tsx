import type { Meta, StoryObj } from "@storybook/react-vite";
import { Metric } from "./Metric";
import { Grid } from "../../components/layout";

const meta = {
  title: "Data/Metric",
  component: Metric,
  tags: ["autodocs"],
  argTypes: {
    props: { control: "object" },
  },
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    props: {
      label: "Total Revenue",
      value: "$1.2M",
      description: "+12% from last quarter",
      trend: "up",
    },
  },
};

export const Playground: Story = {
  args: {
    props: {
      label: "Active Users",
      value: "8,421",
      description: "Daily active users",
      trend: "neutral",
    },
  },
};

export const Composition: Story = {
  name: "Grid of Metrics",
  render: () => (
    <Grid min="200px" space="var(--space-m)">
      <Metric props={{ label: "Revenue", value: "$1.2M", description: "+12%", trend: "up" }} />
      <Metric props={{ label: "Users", value: "8,421", description: "-3%", trend: "down" }} />
      <Metric props={{ label: "Sessions", value: "24.1K", description: "Stable", trend: "neutral" }} />
      <Metric props={{ label: "Conversion", value: "3.2%", description: "+0.5pp", trend: "up" }} />
    </Grid>
  ),
};
