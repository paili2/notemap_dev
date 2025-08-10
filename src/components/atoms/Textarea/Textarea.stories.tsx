import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "atoms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "내용을 입력하세요...",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "비활성 상태",
    disabled: true,
  },
};
