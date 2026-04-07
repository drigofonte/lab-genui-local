import type { Meta, StoryObj } from "@storybook/react-vite";
import { Frame } from "./Frame";

const meta = {
  title: "Layout/Frame",
  component: Frame,
  tags: ["autodocs"],
  argTypes: {
    ratio: { control: "text" },
  },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ratio: "16 / 9" },
  render: (args) => (
    <Frame {...args}>
      <div style={{ width: "100%", height: "100%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        16:9 Frame
      </div>
    </Frame>
  ),
};

export const Playground: Story = {
  args: { ratio: "4 / 3" },
  render: (args) => (
    <Frame {...args}>
      <div style={{ width: "100%", height: "100%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Adjust the ratio
      </div>
    </Frame>
  ),
};

export const Composition: Story = {
  name: "Video placeholder in Frame",
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <Frame ratio="16 / 9">
        <div style={{ width: "100%", height: "100%", background: "var(--primary)", color: "var(--primary-foreground)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--step-1)" }}>
          &#9654; Play Video
        </div>
      </Frame>
    </div>
  ),
};
