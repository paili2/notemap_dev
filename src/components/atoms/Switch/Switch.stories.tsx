import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components/atoms/Switch/Switch";

const meta = {
  title: "atoms/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ✅ 완전 최소: 상태/라벨 없이, 브라우저 기본 포커스만
export const UncontrolledOff: Story = {
  args: { id: "switch-off", "aria-label": "switch off", defaultChecked: false },
};

export const UncontrolledOn: Story = {
  args: { id: "switch-on", "aria-label": "switch on", defaultChecked: true },
};

export const Disabled: Story = {
  args: {
    id: "switch-disabled",
    "aria-label": "switch disabled",
    disabled: true,
    defaultChecked: true,
  },
};
