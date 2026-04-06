import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  tags: ["autodocs"],
  argTypes: {
    space: { control: "text" },
    recursive: { control: "boolean" },
    splitAfter: { control: "number" },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const Placeholder = ({ label }: { label: string }) => (
  <div style={{ padding: "var(--space-s)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
    {label}
  </div>
);

export const Default: Story = {
  args: { space: "var(--space-m)" },
  render: (args) => (
    <Stack {...args}>
      <Placeholder label="Item 1" />
      <Placeholder label="Item 2" />
      <Placeholder label="Item 3" />
    </Stack>
  ),
};

export const Playground: Story = {
  args: { space: "var(--space-m)", recursive: false, splitAfter: undefined },
  render: (args) => (
    <Stack {...args}>
      <Placeholder label="Item 1" />
      <Placeholder label="Item 2" />
      <Placeholder label="Item 3" />
      <Placeholder label="Item 4" />
    </Stack>
  ),
};

export const Composition: Story = {
  render: () => (
    <Stack space="var(--space-l)">
      <h2 style={{ fontSize: "var(--step-2)" }}>Dashboard</h2>
      <Stack space="var(--space-s)">
        <Placeholder label="Metric A" />
        <Placeholder label="Metric B" />
      </Stack>
      <Placeholder label="Chart" />
    </Stack>
  ),
};
