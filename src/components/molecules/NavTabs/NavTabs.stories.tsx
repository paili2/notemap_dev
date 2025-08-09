import type { Meta, StoryObj } from "@storybook/react";
import { NavTabs } from "./NavTabs";

const meta = {
  title: "molecules/NavTabs",
  component: NavTabs,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    tabs: [
      { value: "home", label: "홈" },
      { value: "posts", label: "게시글" },
      { value: "settings", label: "설정" },
    ],
    defaultValue: "home",
  },
} satisfies Meta<typeof NavTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithStateLog: Story = {
  args: {
    onValueChange: (v: string) => {
      // 스토리북 액션 패널 대신 콘솔로 확인
      // (필요하면 @storybook/test 의 action 사용 가능)
      console.log("[NavTabs change]", v);
    },
  },
};

export const LongLabels: Story = {
  args: {
    tabs: [
      { value: "overview", label: "개요 및 통합 현황" },
      { value: "analytics", label: "지표/분석" },
      { value: "team", label: "팀/권한 설정" },
      { value: "billing", label: "결제/청구 관리" },
    ],
    defaultValue: "overview",
  },
};
