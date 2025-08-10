import type { Meta, StoryObj } from "@storybook/react";
import { CalendarPageLayout } from "./CalendarPageLayout";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

const meta: Meta<typeof CalendarPageLayout> = {
  title: "layouts/CalendarPageLayout",
  component: CalendarPageLayout,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof CalendarPageLayout>;

export const Default: Story = {
  args: {
    title: "일정 관리",
    subtitle: "팀 스케줄을 한 눈에 확인",
    sidebar: (
      <div className="space-y-4">
        <Input placeholder="검색..." />
        <Button className="w-full">새 일정 추가</Button>
      </div>
    ),
    children: (
      <div className="rounded-md border bg-card p-4 h-[500px]">
        캘린더 컴포넌트 자리
      </div>
    ),
  },
};
