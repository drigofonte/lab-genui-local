import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switcher } from "./Switcher";

const meta = {
  title: "Layout/Switcher",
  component: Switcher,
  tags: ["autodocs"],
  argTypes: {
    threshold: { control: "text" },
    space: { control: "text" },
    limit: { control: "number" },
  },
} satisfies Meta<typeof Switcher>;

export default meta;
type Story = StoryObj<typeof meta>;

const Card = ({ label }: { label: string }) => (
  <div style={{ padding: "var(--space-m)", background: "var(--muted)", borderRadius: "var(--radius)", textAlign: "center" }}>
    {label}
  </div>
);

export const Default: Story = {
  args: { threshold: "30rem", space: "var(--space-m)", limit: 4 },
  render: (args) => (
    <Switcher {...args}>
      <Card label="Panel 1" />
      <Card label="Panel 2" />
      <Card label="Panel 3" />
    </Switcher>
  ),
};

export const Playground: Story = {
  args: { threshold: "30rem", space: "var(--space-m)", limit: 4 },
  render: (args) => (
    <Switcher {...args}>
      <Card label="A" />
      <Card label="B" />
      <Card label="C" />
      <Card label="D" />
    </Switcher>
  ),
};

export const Composition: Story = {
  name: "Switcher as metric row",
  render: () => (
    <Switcher threshold="25rem" space="var(--space-s)">
      <div style={{ padding: "var(--space-m)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <strong>Revenue</strong>
        <p style={{ fontSize: "var(--step-2)" }}>$1.2M</p>
      </div>
      <div style={{ padding: "var(--space-m)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <strong>Users</strong>
        <p style={{ fontSize: "var(--step-2)" }}>8,421</p>
      </div>
      <div style={{ padding: "var(--space-m)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <strong>Growth</strong>
        <p style={{ fontSize: "var(--step-2)" }}>+12%</p>
      </div>
    </Switcher>
  ),
};
