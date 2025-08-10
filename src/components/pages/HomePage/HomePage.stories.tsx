import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { within, expect } from "@storybook/test";

import HomePage from "@/components/pages/HomePage/HomePage";

const meta: Meta<typeof HomePage> = {
  title: "pages/HomePage",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof HomePage>;

/** 기본 랜딩 화면 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // 히어로 타이틀
    await expect(
      await c.findByRole("heading", { name: /NoteMap에 오신 것을 환영합니다/i })
    ).toBeInTheDocument();
    // 주요 버튼
    await expect(
      await c.findByRole("button", { name: "시작하기" })
    ).toBeInTheDocument();
    await expect(
      await c.findByRole("button", { name: "더 알아보기" })
    ).toBeInTheDocument();
    // 섹션 타이틀
    await expect(
      await c.findByRole("heading", { level: 2, name: "주요 기능" })
    ).toBeInTheDocument();
  },
};

/** 다크 모드 스냅샷(있다면) */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: { story: "Storybook 배경을 다크로 전환한 스냅샷입니다." },
    },
  },
};
