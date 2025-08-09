import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./Toaster";
import { toast } from "@/hooks/use-toast";
import { Button } from "../Button/Button";

const meta: Meta<typeof Toaster> = {
  title: "Atoms/Toast",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof Toaster>;

/**
 * 기본 토스트
 */
export const Default: Story = {
  render: () => (
    <div className="space-x-2">
      <Button
        onClick={() =>
          toast({
            title: "기본 알림",
            description: "스토리북에서 띄운 기본 토스트입니다.",
          })
        }
      >
        기본 토스트
      </Button>

      <Button
        variant="destructive"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "에러 발생",
            description: "문제가 발생했습니다.",
          })
        }
      >
        에러 토스트
      </Button>

      <Toaster />
    </div>
  ),
};
