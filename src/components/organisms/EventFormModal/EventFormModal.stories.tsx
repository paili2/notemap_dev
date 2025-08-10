import type { Meta, StoryObj } from "@storybook/react";
import { EventFormModal } from "./EventFormModal";

const meta: Meta<typeof EventFormModal> = {
  title: "organisms/EventFormModal",
  component: EventFormModal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered", // 폼이 보기 좋게 중앙 배치
  },
  argTypes: {
    onCreate: { action: "create-event" },
    triggerLabel: { control: "text" },
    defaultDate: { control: "date" },
  },
};

export default meta;
type Story = StoryObj<typeof EventFormModal>;

// 기본 케이스
export const Default: Story = {
  args: {
    triggerLabel: "새 일정",
    defaultDate: new Date().toISOString().split("T")[0], // 오늘 날짜
  },
};

// 긴 라벨 케이스
export const CustomLabel: Story = {
  args: {
    triggerLabel: "📅 일정 추가하기",
    defaultDate: "2025-08-15",
  },
};
