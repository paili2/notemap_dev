import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/atoms/HoverCard/HoverCard";
import { Button } from "@/components/atoms/Button/Button";

// HoverCardContent의 props를 기준으로 스토리 args 타입을 잡아야
// side / align / sideOffset 등의 컨트롤이 타입 에러 없이 동작합니다.

type HoverCardContentProps = React.ComponentProps<typeof HoverCardContent>;

const HoverCardDemo = (props: HoverCardContentProps) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Button variant="outline">마우스를 올려보세요</Button>
    </HoverCardTrigger>
    <HoverCardContent {...props}>
      <div className="space-y-2">
        <div className="text-sm font-medium">HoverCard 제목</div>
        <p className="text-xs text-muted-foreground">
          마우스를 트리거에 올리면 표시됩니다. 위치/여백은 컨트롤에서
          바꿔보세요.
        </p>
      </div>
    </HoverCardContent>
  </HoverCard>
);

const meta: Meta<typeof HoverCardDemo> = {
  title: "Atoms/HoverCard",
  component: HoverCardDemo,
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
    side: "top",
    align: "center",
    sideOffset: 8,
  },
};
export default meta;

type Story = StoryObj<typeof HoverCardDemo>;

export const Basic: Story = {};

export const Positioned: Story = {
  args: {
    side: "right",
    align: "start",
    sideOffset: 12,
  },
};

export const WithImage: Story = {
  args: {
    className: "w-80",
  },
  render: (args) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="secondary">프로필 미리보기</Button>
      </HoverCardTrigger>
      <HoverCardContent {...args}>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160"
              alt="avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">홍길동</div>
            <div className="text-xs text-muted-foreground">
              Product Designer @ Acme
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              디자인 시스템을 만들고 운영합니다. shadcn/ui + Storybook으로
              컴포넌트를 관리해요.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Playground: Story = {
  args: {
    side: "bottom",
    align: "center",
    sideOffset: 6,
    className: "w-72",
  },
};
