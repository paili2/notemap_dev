import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/atoms/Button/Button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Basic: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">마우스를 올려보세요</Button>
        </TooltipTrigger>
        <TooltipContent>툴팁 내용</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const Positions: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">위쪽</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">오른쪽</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">아래쪽</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">왼쪽</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const LongContent: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>긴 내용</Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px]">
          여러 줄이 될 정도로 긴 설명 텍스트입니다. 키보드 포커스(탭)로도 열리고
          버튼에 포커스를 유지하는 동안 표시됩니다.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const WithIconOnlyTrigger: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label="정보"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border px-2"
          >
            i
          </button>
        </TooltipTrigger>
        <TooltipContent>아이콘만 있는 트리거</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
