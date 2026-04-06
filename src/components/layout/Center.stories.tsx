import type { Meta, StoryObj } from "@storybook/react-vite";
import { Center } from "./Center";

const meta = {
  title: "Layout/Center",
  component: Center,
  tags: ["autodocs"],
  argTypes: {
    maxWidth: { control: "text" },
    centerText: { control: "boolean" },
    gutters: { control: "text" },
    intrinsic: { control: "boolean" },
  },
} satisfies Meta<typeof Center>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { maxWidth: "40ch" },
  render: (args) => (
    <Center {...args}>
      <p>This paragraph is constrained to a comfortable reading width and centered horizontally.</p>
    </Center>
  ),
};

export const Playground: Story = {
  args: { maxWidth: "60ch", centerText: false, gutters: "var(--space-m)", intrinsic: false },
  render: (args) => (
    <Center {...args}>
      <p>Adjust max-width, text alignment, gutters, and intrinsic centering.</p>
    </Center>
  ),
};

export const Composition: Story = {
  render: () => (
    <Center maxWidth="50ch" centerText>
      <h2 style={{ fontSize: "var(--step-3)" }}>Welcome</h2>
      <p>A centered hero section with constrained text.</p>
    </Center>
  ),
};
