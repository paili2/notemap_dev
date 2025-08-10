import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
import { Button } from "@/components/atoms/Button/Button";

// 스토리에서 재사용할 데모 컴포넌트
type DemoDialogProps = React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  childrenInside?: React.ReactNode; // Content 내부 커스텀 콘텐츠
  triggerLabel?: string;
  showFooter?: boolean;
};

function DemoDialog({
  title = "모달 타이틀",
  description = "설명 텍스트가 여기에 들어갑니다.",
  childrenInside,
  triggerLabel = "Open Dialog",
  showFooter = true,
  ...rootProps
}: DemoDialogProps) {
  return (
    <Dialog {...rootProps}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {childrenInside ?? (
            <>
              <p className="text-sm">
                본문 콘텐츠 영역입니다. 임의의 컴포넌트나 폼을 배치하세요.
              </p>
              <p className="text-sm text-muted-foreground">
                shadcn Dialog 기반 도메인 모달을 손쉽게 구성할 수 있습니다.
              </p>
            </>
          )}
        </div>

        {showFooter && (
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="secondary">취소</Button>
            </DialogClose>
            <Button>확인</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

const meta: Meta<typeof DemoDialog> = {
  title: "atoms/Dialog",
  component: DemoDialog,
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    defaultOpen: { control: "boolean" },
    onOpenChange: { action: "open-change" },
    title: { control: "text" },
    description: { control: "text" },
    triggerLabel: { control: "text" },
    showFooter: { control: "boolean" },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof DemoDialog>;

export const Basic: Story = {
  args: {
    triggerLabel: "Open Dialog",
    title: "모달 타이틀",
    description: "설명 텍스트가 여기에 들어갑니다.",
    showFooter: true,
  },
};

export const LongContent: Story = {
  args: {
    triggerLabel: "Open Long Dialog",
    title: "스크롤 가능한 모달",
    description: "내용이 길어지면 DialogContent에 스크롤이 생깁니다.",
    showFooter: true,
    childrenInside: (
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i} className="text-sm">
            긴 내용 라인 {i + 1}. 모달 높이를 초과하면 내부 스크롤이 적용됩니다.
          </p>
        ))}
      </div>
    ),
  },
};

export const ControlledOpen: Story = {
  args: {
    open: true, // Storybook Controls로 on/off 확인
    triggerLabel: "Always Open (controlled)",
    title: "컨트롤드 모달",
    description: "open prop으로 제어되는 예시입니다.",
  },
};
