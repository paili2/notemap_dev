import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label"; // Label 컴포넌트 import 경로 확인!

const meta = {
  title: "atoms/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "이메일",
    htmlFor: "email",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RightAligned: Story = {
  args: { className: "w-24 text-right" },
};

export const WithInputRow: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Label {...args} className="w-24 text-right" />
      <input
        id="email"
        className="border px-2 py-1 rounded"
        placeholder="you@example.com"
      />
    </div>
  ),
};
