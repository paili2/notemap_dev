import { Meta, StoryObj } from "@storybook/react";
import Checkbox, { CheckboxProps } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "select", options: ["small", "medium", "large"] },
    disabled: { control: "boolean" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<CheckboxProps>;

export const Default: Story = {
  args: {
    label: "체크박스",
    size: "medium",
    disabled: false,
  },
};
