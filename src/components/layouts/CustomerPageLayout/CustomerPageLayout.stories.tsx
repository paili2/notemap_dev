import type { Meta, StoryObj } from "@storybook/react";
import { CustomerPageLayout } from "./CustomerPageLayout";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Card } from "@/components/atoms/Card/Card";

const meta: Meta<typeof CustomerPageLayout> = {
  title: "layouts/CustomerPageLayout",
  component: CustomerPageLayout,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof CustomerPageLayout>;

export const Default: Story = {
  args: {
    title: "고객 관리",
    subtitle: "NoteMap 고객 정보를 조회하고 관리합니다.",
    actions: <Button>새 고객 추가</Button>,
    sidebar: (
      <div className="space-y-4">
        <Input placeholder="고객 검색..." />
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">세그먼트</div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>신규</li>
            <li>활성</li>
            <li>휴면</li>
            <li>VIP</li>
          </ul>
        </Card>
      </div>
    ),
    children: <Card className="p-4 h-[480px]">고객 테이블 자리</Card>,
  },
};
