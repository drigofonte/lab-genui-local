import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { Stack } from "./Stack";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  argTypes: {
    side: { control: "radio", options: ["left", "right"] },
    sideWidth: { control: "text" },
    contentMin: { control: "text" },
    space: { control: "text" },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Panel = ({ label, bg }: { label: string; bg?: string }) => (
  <div style={{ padding: "var(--space-m)", background: bg || "var(--muted)", borderRadius: "var(--radius)" }}>
    {label}
  </div>
);

export const Default: Story = {
  args: { side: "left", sideWidth: "15rem", contentMin: "50%", space: "var(--space-l)" },
  render: (args) => (
    <Sidebar {...args}>
      <Panel label="Sidebar" />
      <Panel label="Main Content" />
    </Sidebar>
  ),
};

export const Playground: Story = {
  args: { side: "left", sideWidth: "20rem", contentMin: "50%", space: "var(--space-l)" },
  render: (args) => (
    <Sidebar {...args}>
      <Panel label="Sidebar" />
      <Panel label="Main Content" />
    </Sidebar>
  ),
};

export const Composition: Story = {
  name: "Sidebar with Stack navigation",
  render: () => (
    <Sidebar sideWidth="12rem" space="var(--space-l)">
      <Stack space="var(--space-xs)">
        <Panel label="Nav Item 1" />
        <Panel label="Nav Item 2" />
        <Panel label="Nav Item 3" />
      </Stack>
      <Stack space="var(--space-m)">
        <h2 style={{ fontSize: "var(--step-2)" }}>Dashboard</h2>
        <Panel label="Content Area" />
      </Stack>
    </Sidebar>
  ),
};
