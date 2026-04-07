import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cluster } from "./Cluster";

const meta = {
  title: "Layout/Cluster",
  component: Cluster,
  tags: ["autodocs"],
  argTypes: {
    space: { control: "text" },
    justify: { control: "select", options: ["flex-start", "center", "flex-end", "space-between"] },
    align: { control: "select", options: ["flex-start", "center", "flex-end", "stretch"] },
  },
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

const Tag = ({ label }: { label: string }) => (
  <span style={{ padding: "0.25em 0.75em", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", fontSize: "var(--step--1)" }}>
    {label}
  </span>
);

export const Default: Story = {
  args: { space: "var(--space-s)" },
  render: (args) => (
    <Cluster {...args}>
      <Tag label="React" />
      <Tag label="TypeScript" />
      <Tag label="CSS" />
      <Tag label="Design Systems" />
      <Tag label="Every Layout" />
    </Cluster>
  ),
};

export const Playground: Story = {
  args: { space: "var(--space-m)", justify: "flex-start", align: "center" },
  render: (args) => (
    <Cluster {...args}>
      <Tag label="Tag 1" />
      <Tag label="Tag 2" />
      <Tag label="Tag 3" />
      <Tag label="Tag 4" />
      <Tag label="Tag 5" />
      <Tag label="Tag 6" />
    </Cluster>
  ),
};

export const Composition: Story = {
  render: () => (
    <div>
      <h3 style={{ fontSize: "var(--step-1)", marginBlockEnd: "var(--space-s)" }}>Skills</h3>
      <Cluster space="var(--space-xs)">
        <Tag label="Frontend" />
        <Tag label="Backend" />
        <Tag label="DevOps" />
        <Tag label="Design" />
      </Cluster>
    </div>
  ),
};
