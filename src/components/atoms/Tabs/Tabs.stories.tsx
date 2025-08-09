import type { Meta, StoryObj } from "@storybook/react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/Tabs/Tabs";

const meta = {
  title: "atoms/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    defaultValue: "account",
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => (
    <Tabs {...args} className="w-[420px]">
      <TabsList>
        <TabsTrigger value="account">계정</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
        <TabsTrigger value="settings">설정</TabsTrigger>
      </TabsList>
      <div className="mt-4 rounded border p-4">
        <TabsContent value="account">계정 정보</TabsContent>
        <TabsContent value="password">비밀번호 변경</TabsContent>
        <TabsContent value="settings">환경 설정</TabsContent>
      </div>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  args: { defaultValue: "t1" },
  render: (args) => (
    <Tabs {...args} className="w-[520px]">
      <TabsList className="flex flex-wrap justify-start gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <TabsTrigger key={i} value={`t${i + 1}`}>
            탭 {i + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-4 rounded border p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TabsContent key={i} value={`t${i + 1}`}>
            콘텐츠 {i + 1}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  ),
};
