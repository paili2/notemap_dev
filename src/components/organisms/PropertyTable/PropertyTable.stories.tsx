import type { Meta, StoryObj } from "@storybook/react";
import { PropertyTable, type Property } from "./PropertyTable";

const meta: Meta<typeof PropertyTable> = {
  title: "organisms/PropertyTable",
  component: PropertyTable,
  tags: ["autodocs"],
  argTypes: {
    onRowClick: { action: "row-click" },
    onViewClick: { action: "view-click" },
  },
};

export default meta;
type Story = StoryObj<typeof PropertyTable>;

const sample: Property[] = [
  {
    id: 1,
    title: "서울 강남구 오피스텔",
    price: "5억 2,000만원",
    location: "서울특별시 강남구",
    status: "판매중",
    imageUrl: "https://placehold.co/400x260?text=Property+1",
  },
  {
    id: 2,
    title: "부산 해운대 아파트",
    price: "3억 8,000만원",
    location: "부산광역시 해운대구",
    status: "계약완료",
    imageUrl: "https://placehold.co/400x260?text=Property+2",
  },
  {
    id: 3,
    title: "인천 송도 신축 빌라",
    price: "2억 5,000만원",
    location: "인천광역시 연수구",
    status: "판매중",
    imageUrl: "https://placehold.co/400x260?text=Property+3",
  },
];

export const Default: Story = {
  args: {
    properties: sample,
  },
};

export const Empty: Story = {
  args: {
    properties: [],
  },
};
