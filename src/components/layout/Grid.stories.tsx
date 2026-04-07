import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  tags: ["autodocs"],
  argTypes: {
    min: { control: "text" },
    space: { control: "text" },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Card = ({ label }: { label: string }) => (
  <div style={{ padding: "var(--space-m)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
    {label}
  </div>
);

export const Default: Story = {
  args: { min: "250px", space: "var(--space-m)" },
  render: (args) => (
    <Grid {...args}>
      <Card label="Card 1" />
      <Card label="Card 2" />
      <Card label="Card 3" />
      <Card label="Card 4" />
      <Card label="Card 5" />
      <Card label="Card 6" />
    </Grid>
  ),
};

export const Playground: Story = {
  args: { min: "200px", space: "var(--space-l)" },
  render: (args) => (
    <Grid {...args}>
      <Card label="A" />
      <Card label="B" />
      <Card label="C" />
      <Card label="D" />
    </Grid>
  ),
};

export const Composition: Story = {
  name: "Dashboard card grid",
  render: () => (
    <Grid min="200px" space="var(--space-m)">
      {["Revenue", "Users", "Sessions", "Conversion"].map((label) => (
        <div key={label} style={{ padding: "var(--space-m)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
          <strong>{label}</strong>
          <p style={{ fontSize: "var(--step-2)", marginBlockStart: "var(--space-3xs)" }}>—</p>
        </div>
      ))}
    </Grid>
  ),
};
