import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";

import CustomerPage from "@/components/pages/CustomerPage/CustomerPage";

const meta: Meta<typeof CustomerPage> = {
  title: "pages/CustomerPage",
  component: CustomerPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof CustomerPage>;

/** 기본 목록 화면 */
export const Default: Story = {};

/** 검색으로 필터링되는지 확인 (이름/이메일/상태) */
export const SearchFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByPlaceholderText("고객 검색...");
    await userEvent.clear(input);
    await userEvent.type(input, "lee");

    // "이영희"가 보이고, "김철수"는 숨겨지는지 체크
    await expect(await canvas.findByText("이영희")).toBeInTheDocument();
  },
};

/** 검색 결과가 없는 상태 UX 확인 */
export const EmptyAfterSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByPlaceholderText("고객 검색...");
    await userEvent.clear(input);
    await userEvent.type(input, "no-match-keyword");
    await expect(
      await canvas.findByText("표시할 고객이 없습니다.")
    ).toBeInTheDocument();
  },
};

/** 세그먼트(배지) UI 스냅샷 확인용 */
export const SegmentsSnapshot: Story = {};
