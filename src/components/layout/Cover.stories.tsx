import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cover } from "./Cover";
import { Center } from "./Center";

const meta = {
  title: "Layout/Cover",
  component: Cover,
  tags: ["autodocs"],
  argTypes: {
    minHeight: { control: "text" },
    space: { control: "text" },
    noPad: { control: "boolean" },
  },
} satisfies Meta<typeof Cover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { minHeight: "50vh", space: "var(--space-m)" },
  render: (args) => (
    <Cover {...args}>
      <h1 style={{ fontSize: "var(--step-4)" }}>Hero Title</h1>
      <footer style={{ color: "var(--muted-foreground)", fontSize: "var(--step--1)" }}>Footer content</footer>
    </Cover>
  ),
};

export const Playground: Story = {
  args: { minHeight: "60vh", space: "var(--space-l)", noPad: false },
  render: (args) => (
    <Cover {...args}>
      <h1 style={{ fontSize: "var(--step-4)" }}>Centered Content</h1>
      <p>Below the fold</p>
    </Cover>
  ),
};

export const Composition: Story = {
  render: () => (
    <Cover minHeight="50vh" space="var(--space-m)">
      <Center maxWidth="40ch" centerText>
        <h1 style={{ fontSize: "var(--step-4)" }}>Welcome</h1>
        <p>A cover with centered text content.</p>
      </Center>
      <footer style={{ textAlign: "center", color: "var(--muted-foreground)" }}>
        &copy; 2026
      </footer>
    </Cover>
  ),
};
