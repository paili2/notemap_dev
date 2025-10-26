import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SafeImg } from "@/components/common/SafeImg";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/atoms/HoverCard/HoverCard";
import { Button } from "../Button/Button";

const meta = {
  title: "Atoms/HoverCard",
  component: HoverCardContent,
  parameters: { layout: "centered" },
} satisfies Meta<typeof HoverCardContent>;

export default meta;

type Story = StoryObj<typeof HoverCardContent>;

export const WithImage: Story = {
  args: {
    className: "w-80",
    side: "right",
    align: "start",
    sideOffset: 12,
  },
  render: (args) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="secondary">프로필 미리보기</Button>
      </HoverCardTrigger>
      <HoverCardContent {...args}>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border bg-muted">
            <SafeImg
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160"
              alt="avatar"
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full rounded-full bg-gray-200"
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
