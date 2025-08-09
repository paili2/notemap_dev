import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/atoms/Popover/Popover";
import { Button } from "@/components/atoms/Button/Button";

// PopoverContent의 props를 기준으로 스토리 args 타입을 잡아야
// align / side / sideOffset 등의 컨트롤이 타입 에러 없이 동작합니다.

type PopoverContentProps = React.ComponentProps<typeof PopoverContent>;

const PopoverDemo = (props: PopoverContentProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">열기</Button>
    </PopoverTrigger>
    <PopoverContent {...props}>
      <div className="space-y-1">
        <div className="text-sm font-medium">제목</div>
        <p className="text-xs text-muted-foreground">
          여기에 원하는 내용을 넣을 수 있습니다.
        </p>
      </div>
    </PopoverContent>
  </Popover>
);

const meta: Meta<typeof PopoverDemo> = {
  title: "Atoms/Popover",
  component: PopoverDemo,
  parameters: { layout: "centered" },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "right", "bottom", "left"],
    },
    align: { control: { type: "radio" }, options: ["start", "center", "end"] },
    sideOffset: { control: { type: "number", min: 0, max: 20, step: 1 } },
    className: { control: "text" },
  },
  args: {
    side: "bottom",
    align: "center",
    sideOffset: 4,
  },
};
export default meta;

type Story = StoryObj<typeof PopoverDemo>;

export const Basic: Story = {};

export const Positioned: Story = {
  args: {
    side: "right",
    align: "start",
    sideOffset: 8,
  },
};

export const CustomWidth: Story = {
  args: {
    className: "w-[420px]",
  },
};

export const Playground: Story = {
  args: {
    side: "bottom",
    align: "center",
    sideOffset: 6,
    className: "w-80",
  },
};
