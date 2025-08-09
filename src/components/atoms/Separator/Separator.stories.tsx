import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Separator } from "@/components/atoms/Separator/Separator";

const meta: Meta<typeof Separator> = {
  title: "Atoms/Separator",
  component: Separator,
  parameters: { layout: "centered" },
  argTypes: {
    orientation: {
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
    },
    decorative: { control: "boolean" },
    className: { control: "text" },
  },
  args: {
    orientation: "horizontal",
    decorative: true,
  },
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-[360px] space-y-3">
      <div className="text-sm text-muted-foreground">위</div>
      <Separator {...args} />
      <div className="text-sm text-muted-foreground">아래</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: (args) => (
    <div className="h-[160px] w-[360px] flex items-center gap-3">
      <div className="flex-1 text-sm text-muted-foreground">왼쪽</div>
      <Separator {...args} orientation="vertical" />
      <div className="flex-1 text-sm text-muted-foreground">오른쪽</div>
    </div>
  ),
};

export const InsetExample: Story = {
  render: () => (
    <div className="w-[360px] rounded-xl border p-4">
      <div className="text-sm font-medium">섹션 A</div>
      <p className="text-xs text-muted-foreground">설명 텍스트</p>
      <Separator className="my-3" />
      <div className="text-sm font-medium">섹션 B</div>
      <p className="text-xs text-muted-foreground">설명 텍스트</p>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    orientation: "horizontal",
    decorative: true,
    className: "my-2",
  },
  render: (args) => (
    <div className="w-[360px]">
      <Separator {...args} />
    </div>
  ),
};
