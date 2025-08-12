import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "@storybook/testing-library";
import { PropertyModal } from "./PropertyModal";
import type { PropertyFormValues } from "@/features/properties/types/propertyForm";

const meta: Meta<typeof PropertyModal> = {
  title: "features/properties/PropertyModal",
  component: PropertyModal,
  parameters: { layout: "centered" },
  argTypes: {
    onSubmit: { action: "submit" },
  },
};
export default meta;

type Story = StoryObj<typeof PropertyModal>;

export const Create: Story = {
  name: "등록 모드 (trigger로 열기)",
  args: {
    mode: "create",
    triggerLabel: "매물 등록",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /매물 등록/i }));
  },
};

export const EditWithDefaults: Story = {
  name: "수정 모드 (기본값 포함)",
  args: {
    mode: "edit",
    triggerLabel: "매물 수정",
    defaultValues: {
      // 실제 폼 스키마에 맞게 조정하세요
      title: "성수동 리버뷰 84A",
      price: 420000000,
      address: "서울 성동구 성수동",
    } as Partial<PropertyFormValues>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /매물 수정/i }));
  },
};
