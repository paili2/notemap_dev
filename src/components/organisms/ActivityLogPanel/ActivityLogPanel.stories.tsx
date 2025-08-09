import type { Meta, StoryObj } from "@storybook/react";
import { ActivityLogPanel } from "./ActivityLogPanel";

const meta = {
  title: "molecules/ActivityLogPanel",
  component: ActivityLogPanel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    title: "최근 활동",
    logs: [
      {
        id: 1,
        action: "로그인 성공",
        user: "홍길동",
        timestamp: "2025-08-09 14:32",
        status: "success",
      },
      {
        id: 2,
        action: "비밀번호 변경",
        user: "김영희",
        timestamp: "2025-08-09 13:10",
        status: "info",
      },
      {
        id: 3,
        action: "잘못된 로그인 시도",
        user: "Unknown",
        timestamp: "2025-08-09 12:50",
        status: "error",
      },
      {
        id: 4,
        action: "권한 변경",
        user: "관리자",
        timestamp: "2025-08-08 19:24",
        status: "warning",
      },
    ],
  },
} satisfies Meta<typeof ActivityLogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { logs: [] },
};
