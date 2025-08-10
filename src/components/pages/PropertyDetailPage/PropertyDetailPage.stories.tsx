import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { within, expect } from "@storybook/test";
import PropertyDetailPage, { PropertyDetail } from "./PropertyDetailPage";

// 필요시 실제 MapView를 연결할 수 있도록 더미 슬롯 준비
const DummyMap = () => (
  <div className="aspect-video w-full bg-accent/30 grid place-items-center rounded-md">
    <span className="text-sm text-muted-foreground">
      Map slot (예: 실제 MapView)
    </span>
  </div>
);

const baseData: PropertyDetail = {
  id: "pin-1001",
  title: "성수동 리버뷰 84A",
  status: "공개",
  type: "아파트",
  priceText: "전세 4.2억",
  updatedAt: "2025-08-09T05:25:00+09:00",
  tags: ["리버뷰", "역세권", "신축"],
  description:
    "성수동 한강변 리버뷰 세대. 남향 통풍 우수, 초등학교/공원 근접.\n리모델링 옵션 협의 가능.",
  photos: [
    {
      id: "ph1",
      url: "https://picsum.photos/seed/pp1/1280/720",
      alt: "거실 전경",
    },
    { id: "ph2", url: "https://picsum.photos/seed/pp2/1280/720", alt: "침실" },
    { id: "ph3", url: "https://picsum.photos/seed/pp3/1280/720", alt: "주방" },
    { id: "ph4", url: "https://picsum.photos/seed/pp4/1280/720", alt: "뷰" },
  ],
  location: { lat: 37.5445, lng: 127.0559, address: "서울 성동구 성수동" },
  noteCount: 2,
  isFavorite: false,
};

const meta: Meta<typeof PropertyDetailPage> = {
  title: "pages/PropertyDetailPage",
  component: PropertyDetailPage,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    data: baseData,
  },
};
export default meta;

type Story = StoryObj<typeof PropertyDetailPage>;

export const Default: Story = {
  args: {
    data: baseData,
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      await c.findByRole("heading", { name: baseData.title })
    ).toBeInTheDocument();
    await expect(await c.findByText("사진")).toBeInTheDocument();
    await expect(await c.findByText("설명")).toBeInTheDocument();
    await expect(await c.findByText("지도")).toBeInTheDocument();
  },
};

export const WithMapSlot: Story = {
  args: {
    data: baseData,
    mapSlot: <DummyMap />,
  },
};

export const NoPhotos: Story = {
  args: {
    data: { ...baseData, photos: [] },
  },
};

export const PrivateDraft: Story = {
  args: {
    data: {
      ...baseData,
      status: "임시",
      isFavorite: true,
      priceText: undefined,
      tags: ["임시저장"],
    },
  },
};
