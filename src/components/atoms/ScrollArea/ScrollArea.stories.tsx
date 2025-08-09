import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./ScrollArea"; // 또는 "@/components/atoms/ScrollArea/ScrollArea"
import { Separator } from "@/components/atoms/Separator/Separator";

const meta = {
  title: "atoms/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    className: "w-[300px] h-[200px] rounded-md border p-4",
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 스크롤 예시 */
export const Default: Story = {
  render: (args) => (
    <ScrollArea {...args}>
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i}>
            <div className="font-medium">아이템 {i + 1}</div>
            <div className="text-sm text-muted-foreground">
              이건 스크롤 테스트를 위한 더미 텍스트입니다.
            </div>
            {i < 19 && <Separator className="my-2" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/** 가로 스크롤 예시 */
export const HorizontalScroll: Story = {
  render: (args) => (
    <ScrollArea {...args} className="w-[300px] h-[100px] rounded-md border">
      <div className="flex space-x-4 p-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[60px] w-[80px] items-center justify-center rounded-md bg-accent"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/** 내용이 짧아서 스크롤이 필요 없는 경우 */
export const NoScrollNeeded: Story = {
  render: (args) => (
    <ScrollArea {...args}>
      <div className="space-y-2">
        <div>짧은 내용</div>
        <div>스크롤바가 표시되지 않습니다.</div>
      </div>
    </ScrollArea>
  ),
};
