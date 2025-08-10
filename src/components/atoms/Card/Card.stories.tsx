import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
import { Button } from "@/components/atoms/Button/Button";

const meta = {
  title: "atoms/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    className: "w-[360px]",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>카드 타이틀</CardTitle>
        <CardDescription>간단한 설명 텍스트</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          콘텐츠 영역입니다. 문단, 리스트, 폼 등 자유롭게 배치하세요.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">확인</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithoutDescription: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>설명 없는 카드</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-4 text-sm space-y-1">
          <li>아이템 A</li>
          <li>아이템 B</li>
          <li>아이템 C</li>
        </ul>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm">
          취소
        </Button>
        <Button size="sm">저장</Button>
      </CardFooter>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: (args) => (
    <Card {...args}>
      <CardContent className="p-6">
        <div className="text-sm">헤더/푸터 없이 콘텐츠만 쓰는 예시입니다.</div>
      </CardContent>
    </Card>
  ),
};

export const HorizontalActionBar: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>프로필</CardTitle>
            <CardDescription>계정 설정 및 공개 정보</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              초기화
            </Button>
            <Button size="sm">변경사항 저장</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          <p>이름: 홍길동</p>
          <p>이메일: gildong@example.com</p>
        </div>
      </CardContent>
      <CardFooter className="justify-end text-xs text-muted-foreground">
        마지막 업데이트: 2025-08-09
      </CardFooter>
    </Card>
  ),
};
