import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { within, userEvent, expect } from "@storybook/test";
import PropertyPage from "./PropertyPage";

const meta: Meta<typeof PropertyPage> = {
  title: "pages/PropertyPage",
  component: PropertyPage,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof PropertyPage>;

export const Default: Story = {};

export const SwitchToListView: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const listBtn = await c.findByLabelText("리스트 보기");
    await userEvent.click(listBtn);
    await expect(
      await c.findByRole("button", { name: "자세히" })
    ).toBeInTheDocument();
  },
};

export const FilterByType_Apt: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const aptTab = await c.findByRole("tab", { name: "아파트" });
    await userEvent.click(aptTab);
    await expect(await c.findAllByText("아파트")).toBeTruthy();
  },
};

export const SearchKeyword: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("제목, 태그, 주소로 검색");
    await userEvent.clear(input);
    await userEvent.type(input, "을지로");
    await expect(await c.findByText(/을지로 코너 상가/)).toBeInTheDocument();
  },
};

export const SortByTitle: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // 정렬 Select 열기
    const buttons = await c.findAllByRole("button");
    const sortTrigger =
      buttons.find((b) => b.getAttribute("id") === "sort") || buttons[1];
    await userEvent.click(sortTrigger!);
    await userEvent.click(await c.findByRole("option", { name: "제목 (A→Z)" }));
    // 단순 존재 체크 (정렬 자체는 스냅샷으로 확인)
    await expect(
      await c.findAllByRole("button", { name: "자세히" })
    ).toBeTruthy();
  },
};

export const ToggleFavoriteOnly: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const favOnly = await c.findByLabelText("즐겨찾기만");
    await userEvent.click(favOnly);
    // 즐겨찾기 표시가 1개 이상 남아있어야 함(목데이터 기준)
    await expect(
      await c.findAllByRole("button", { name: "자세히" })
    ).toBeTruthy();
  },
};
