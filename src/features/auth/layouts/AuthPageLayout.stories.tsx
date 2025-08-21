import type { Meta, StoryObj } from "@storybook/react";
import { AuthPageLayout } from "@/features/auth/layouts/AuthPageLayout";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

const meta: Meta<typeof AuthPageLayout> = {
  title: "layouts/AuthPageLayout",
  component: AuthPageLayout,
  parameters: { layout: "fullscreen" },
  args: {
    title: "로그인",
    subtitle: "계정에 접속해 프로젝트를 시작하세요.",
    logo: <div className="text-xl font-bold">K&N</div>,
    sideImageUrl: "https://placehold.co/1200x1600?text=Brand",
  },
};
export default meta;

type Story = StoryObj<typeof AuthPageLayout>;

export const Default: Story = {
  args: {
    social: (
      <>
        <Button variant="secondary">Google로 계속</Button>
        <Button variant="secondary">GitHub로 계속</Button>
      </>
    ),
    footer: (
      <div className="text-muted-foreground">푸터 영역(약관/링크 등)</div>
    ),
    children: (
      <>
        <Input placeholder="이메일" />
        <Input placeholder="비밀번호" type="password" />
        <Button className="w-full">로그인</Button>
      </>
    ),
  },
};

export const WithOverlayCopy: Story = {
  args: {
    sideOverlay: (
      <div>
        <h2 className="text-3xl font-semibold leading-tight">K&N</h2>
        <p className="mt-3 text-white/80">
          공간을 발견하고, 매물을 연결하세요.
        </p>
      </div>
    ),
  },
};
