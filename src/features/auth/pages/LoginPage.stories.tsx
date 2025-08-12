import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import LoginPage from "@/features/auth/pages/LoginPage";

import {
  getRouterCalls,
  clearRouterCalls,
} from "../../../../.storybook/mocks/next-navigation";

const meta: Meta<typeof LoginPage> = {
  title: "pages/LoginPage",
  component: LoginPage,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof LoginPage>;

/** 기본 렌더 확인 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      await c.findByRole("heading", { name: "로그인" })
    ).toBeInTheDocument();
    await expect(await c.findByLabelText("이메일")).toBeInTheDocument();
    await expect(await c.findByLabelText("비밀번호")).toBeInTheDocument();
    await expect(
      await c.findByRole("button", { name: "로그인" })
    ).toBeInTheDocument();
  },
};

/** 잘못된 자격 증명 → 에러 표시 */
export const WrongCredentials: Story = {
  play: async ({ canvasElement }) => {
    clearRouterCalls();
    const c = within(canvasElement);

    const email = await c.findByPlaceholderText("you@example.com");
    const pw = await c.findByPlaceholderText("••••••••");
    await userEvent.clear(email);
    await userEvent.type(email, "nope@example.com");
    await userEvent.clear(pw);
    await userEvent.type(pw, "wrongpw");
    await userEvent.click(await c.findByRole("button", { name: "로그인" }));

    await waitFor(async () => {
      await expect(await c.findByRole("alert")).toHaveTextContent(
        "이메일 또는 비밀번호가 올바르지 않습니다."
      );
    });

    // router.replace 호출 없어야 함
    expect(getRouterCalls().length).toBe(0);
  },
};

/** 데모 계정 → router.replace('/dashboard') 호출 확인 */
export const DemoSuccess: Story = {
  play: async ({ canvasElement }) => {
    clearRouterCalls();
    const c = within(canvasElement);

    const email = await c.findByPlaceholderText("you@example.com");
    const pw = await c.findByPlaceholderText("••••••••");

    await userEvent.clear(email);
    await userEvent.type(email, "demo@notemap.app");
    await userEvent.clear(pw);
    await userEvent.type(pw, "notemap");
    await userEvent.click(await c.findByRole("button", { name: "로그인" }));

    await waitFor(() => {
      const calls = getRouterCalls();
      // replace('/dashboard')가 최소 1번 호출되었는지 확인
      expect(calls.some((args) => args[0] === "/dashboard")).toBe(true);
    });
  },
};

/** 비밀번호 보기 토글 UX */
export const TogglePasswordVisibility: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    const pw = await c.findByPlaceholderText("••••••••");
    expect((pw as HTMLInputElement).type).toBe("password");

    await userEvent.click(
      await c.findByRole("button", { name: "비밀번호 보기" })
    );
    expect((pw as HTMLInputElement).type).toBe("text");

    await userEvent.click(
      await c.findByRole("button", { name: "비밀번호 숨기기" })
    );
    expect((pw as HTMLInputElement).type).toBe("password");
  },
};
