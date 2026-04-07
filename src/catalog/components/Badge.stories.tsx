import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cluster } from "../../components/layout";

// Inline Badge matching the SimpleRenderer version
function Badge({ props }: { props: { text: string } }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      {props.text}
    </span>
  );
}

const meta = {
  title: "Data/Badge",
  component: Badge,
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    props: { text: "Active" },
  },
};

export const Playground: Story = {
  args: {
    props: { text: "Custom Badge" },
  },
};

export const Composition: Story = {
  name: "Cluster of Badges",
  render: () => (
    <Cluster space="var(--space-xs)">
      <Badge props={{ text: "React" }} />
      <Badge props={{ text: "TypeScript" }} />
      <Badge props={{ text: "CSS" }} />
      <Badge props={{ text: "Storybook" }} />
      <Badge props={{ text: "Every Layout" }} />
    </Cluster>
  ),
};
