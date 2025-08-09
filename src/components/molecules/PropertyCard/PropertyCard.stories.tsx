import type { Meta, StoryObj } from "@storybook/react";
import { PropertyCard } from "./PropertyCard";

const meta = {
  title: "molecules/PropertyCard",
  component: PropertyCard,
  tags: ["autodocs"],
  args: {
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    title: "한남동 고급 빌라",
    address: "서울시 용산구 한남동",
    price: "12억 5,000만원",
    status: "판매중",
  },
} satisfies Meta<typeof PropertyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const 계약중: Story = {
  args: { status: "계약중" },
};

export const 거래완료: Story = {
  args: { status: "거래완료" },
};
