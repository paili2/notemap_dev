import type { Meta, StoryObj } from "@storybook/react";
import { DefaultLayout } from "./DefaultLayout";
import { Card } from "@/components/atoms/Card/Card";

const meta: Meta<typeof DefaultLayout> = {
  title: "layouts/DefaultLayout",
  component: DefaultLayout,
  parameters: { layout: "fullscreen" }, // 화면 전체로 보기
};
export default meta;

type Story = StoryObj<typeof DefaultLayout>;

export const Default: Story = {
  args: {
    children: (
      <Card className="p-6">
        <h1 className="text-xl font-bold mb-4">DefaultLayout 미리보기</h1>
        <p className="text-muted-foreground">
          이 레이아웃은 화면 상하좌우에 패딩을 주고, 중앙정렬 + 최대폭을
          제한합니다.
        </p>
      </Card>
    ),
  },
};
