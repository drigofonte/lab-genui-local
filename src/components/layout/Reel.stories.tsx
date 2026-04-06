import type { Meta, StoryObj } from "@storybook/react-vite";
import { Reel } from "./Reel";

const meta = {
  title: "Layout/Reel",
  component: Reel,
  tags: ["autodocs"],
  argTypes: {
    itemWidth: { control: "text" },
    space: { control: "text" },
    height: { control: "text" },
    noBar: { control: "boolean" },
  },
} satisfies Meta<typeof Reel>;

export default meta;
type Story = StoryObj<typeof meta>;

const ReelItem = ({ label }: { label: string }) => (
  <div style={{ padding: "var(--space-m)", background: "var(--muted)", borderRadius: "var(--radius)", minWidth: "15ch", textAlign: "center" }}>
    {label}
  </div>
);

export const Default: Story = {
  args: { itemWidth: "20ch", space: "var(--space-s)" },
  render: (args) => (
    <Reel {...args}>
      {Array.from({ length: 8 }, (_, i) => (
        <ReelItem key={i} label={`Item ${i + 1}`} />
      ))}
    </Reel>
  ),
};

export const Playground: Story = {
  args: { itemWidth: "25ch", space: "var(--space-m)", height: "auto", noBar: false },
  render: (args) => (
    <Reel {...args}>
      {Array.from({ length: 6 }, (_, i) => (
        <ReelItem key={i} label={`Card ${i + 1}`} />
      ))}
    </Reel>
  ),
};

export const Composition: Story = {
  name: "Image carousel",
  render: () => (
    <Reel itemWidth="200px" space="var(--space-s)" noBar>
      {["Photo 1", "Photo 2", "Photo 3", "Photo 4", "Photo 5"].map((label) => (
        <div key={label} style={{ width: "200px", aspectRatio: "4/3", background: "var(--muted)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {label}
        </div>
      ))}
    </Reel>
  ),
};
