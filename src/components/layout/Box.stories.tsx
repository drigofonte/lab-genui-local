import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "./Box";

const meta = {
  title: "Layout/Box",
  component: Box,
  tags: ["autodocs"],
  argTypes: {
    padding: { control: "text" },
    borderWidth: { control: "text" },
  },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { padding: "var(--space-m)" },
  render: (args) => (
    <Box {...args}>
      <p>Content inside a Box with consistent padding.</p>
    </Box>
  ),
};

export const Playground: Story = {
  args: { padding: "var(--space-l)", borderWidth: "1px" },
  render: (args) => (
    <Box {...args}>
      <p>Adjust padding and border width with controls.</p>
    </Box>
  ),
};

export const Composition: Story = {
  render: () => (
    <Box padding="var(--space-l)" borderWidth="1px">
      <Box padding="var(--space-s)">
        <p>Nested boxes with different padding.</p>
      </Box>
    </Box>
  ),
};
