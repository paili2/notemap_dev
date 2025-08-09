import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "./Sheet";
import { Button } from "@/components/atoms/Button/Button";

type StoryProps = {
  side?: "left" | "right" | "top" | "bottom";
  title?: string;
  description?: string;
  withFooter?: boolean;
  /** 스토리에서 제어하고 싶을 때만 사용 (미지정이면 트리거로 열고 닫기 가능) */
  open?: boolean;
};

const meta: Meta<StoryProps> = {
  title: "atoms/Sheet",
  parameters: { layout: "centered" },
  argTypes: {
    side: {
      control: "radio",
      options: ["left", "right", "top", "bottom"],
    },
    withFooter: { control: "boolean" },
    open: { control: "boolean" },
  },
  args: {
    side: "right",
    title: "시트 제목",
    description: "설명을 여기에 적습니다.",
    withFooter: true,
  },
  // 공통 렌더러: open이 주어지면 '제어형', 아니면 '비제어형(Trigger로 열기)'
  render: (args) => {
    const [internalOpen, setInternalOpen] = React.useState<boolean>(
      !!args.open
    );
    React.useEffect(() => {
      if (typeof args.open === "boolean") setInternalOpen(args.open);
    }, [args.open]);

    const isControlled = typeof args.open === "boolean";
    const open = isControlled ? internalOpen : undefined;
    const onOpenChange = isControlled ? setInternalOpen : undefined;

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent side={args.side}>
          <SheetHeader>
            <SheetTitle>{args.title}</SheetTitle>
            {args.description && (
              <SheetDescription>{args.description}</SheetDescription>
            )}
          </SheetHeader>

          <div className="mt-4 space-y-2">
            <p className="text-sm">
              시트 내부 콘텐츠 예시입니다. 폼, 리스트, 필터 등을 넣어 사용할 수
              있어요.
            </p>
            <p className="text-sm text-muted-foreground">
              모바일에서는 화면 가장자리에서 스와이프해 닫는 UX도
              자연스럽습니다.
            </p>
          </div>

          {args.withFooter && (
            <SheetFooter className="mt-6">
              <SheetClose asChild>
                <Button variant="outline">취소</Button>
              </SheetClose>
              <Button>확인</Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Right: Story = {};

export const Left: Story = {
  args: { side: "left" },
};

export const Top: Story = {
  args: { side: "top" },
};

export const Bottom: Story = {
  args: { side: "bottom" },
};

export const WithLongContent: Story = {
  args: {
    description: "스크롤이 필요한 긴 내용 예시",
  },
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent side={args.side}>
          <SheetHeader>
            <SheetTitle>{args.title}</SheetTitle>
            {args.description && (
              <SheetDescription>{args.description}</SheetDescription>
            )}
          </SheetHeader>

          <div className="mt-4 max-h-[60vh] space-y-3 overflow-auto pr-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <p key={i} className="text-sm">
                긴 콘텐츠 라인 {i + 1}. 스크롤 동작 확인용 텍스트입니다.
              </p>
            ))}
          </div>

          <SheetFooter className="mt-4">
            <SheetClose asChild>
              <Button variant="outline">닫기</Button>
            </SheetClose>
            <Button>확인</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
};

export const ControlledOpen: Story = {
  args: { open: true, side: "right" },
};
