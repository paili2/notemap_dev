import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import SettingsPage from "./SettingsPage";

const meta: Meta<typeof SettingsPage> = {
  title: "pages/SettingsPage",
  component: SettingsPage,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof SettingsPage>;

export const Default: Story = {};

export const InviteFlow: Story = {
  name: "직원 초대 플로우",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    // 직원 탭에 "직원 초대" 버튼 클릭
    await userEvent.click(await c.findByRole("button", { name: /직원 초대/ }));

    // 폼 입력
    await userEvent.type(
      await c.findByPlaceholderText("홍길동"),
      "테스트 사용자"
    );
    await userEvent.type(
      await c.findByPlaceholderText("you@example.com"),
      "tester@example.com"
    );

    // 역할 선택 (Select)
    const triggers = await c.findAllByRole("button");
    const roleTrigger =
      triggers.find((b) => b.textContent?.trim() === "") || triggers[0];
    await userEvent.click(roleTrigger!);
    await userEvent.click(await c.findByRole("option", { name: "직원" }));

    // 초대 보내기
    await userEvent.click(
      await c.findByRole("button", { name: "초대 보내기" })
    );

    // 테이블에 신규 사용자 존재 확인(이메일로)
    await waitFor(async () => {
      await expect(
        await c.findByText("tester@example.com")
      ).toBeInTheDocument();
    });
  },
};

export const ToggleRolePermission: Story = {
  name: "권한 토글",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    // 권한 관리 탭으로 이동
    await userEvent.click(await c.findByRole("tab", { name: /권한 관리/ }));

    // 첫 번째 체크박스 하나 토글(시각적으로 허용/차단 문구 변환 확인)
    const checkbox = (await c.findAllByRole("checkbox"))[0];
    await userEvent.click(checkbox);
  },
};
