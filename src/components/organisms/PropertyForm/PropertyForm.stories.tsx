import type { Meta, StoryObj } from "@storybook/react";
import { PropertyForm, type PropertyFormValues } from "./PropertyForm";

const meta: Meta<typeof PropertyForm> = {
  title: "organisms/PropertyForm",
  component: PropertyForm,
  parameters: { layout: "fullscreen" },
  argTypes: { onSubmit: { action: "submit" } },
};
export default meta;
type Story = StoryObj<typeof PropertyForm>;

export const Create: Story = {
  args: {
    mode: "create",
  },
};

export const Edit: Story = {
  args: {
    mode: "edit",
    defaultValues: {
      title: "예시 매물",
      status: "판매중",
      type: "아파트",
      priceSale: "12억 5,000만",
      address: "서울시 송파구",
      detailAddress: "○○아파트 101동 1001호",
      description: "리모델링 완료, 역세권",
      isPublished: true,
      imageUrls: ["https://placehold.co/800x600?text=Preview"],
    } as Partial<PropertyFormValues>,
  },
};
