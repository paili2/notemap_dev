import type { Meta, StoryObj } from "@storybook/react";
import { ToggleSwitch } from "./ToggleSwitch";

const meta = {
  title: "molecules/ToggleSwitch",
  component: ToggleSwitch,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    id: "notifications",
    label: "알림",
    defaultChecked: false,
    onChange: (checked: boolean) => console.log("토글 상태:", checked),
  },
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const 켜진상태: Story = {
  args: { defaultChecked: true },
};
