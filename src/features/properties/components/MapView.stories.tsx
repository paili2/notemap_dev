import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import MapView from "./MapView";

// 실제 키가 없으면 Kakao SDK가 로드 실패합니다.
const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "YOUR_KEY";

const meta: Meta<typeof MapView> = {
  title: "features/properties/MapView",
  component: MapView,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "카카오 지도 컴포넌트. .env에 NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되어 있어야 정상적으로 로드됩니다.",
      },
    },
  },
  argTypes: {
    appKey: {
      control: "text",
      description: "Kakao Maps JavaScript SDK App Key",
    },
    center: {
      control: "object",
      description: "{ lat: number; lng: number }",
    },
    level: {
      control: { type: "number", min: 1, max: 14, step: 1 },
      description: "지도의 확대/축소 레벨 (작을수록 더 확대)",
    },
  },
  args: {
    appKey: APP_KEY,
    center: { lat: 37.5665, lng: 126.978 }, // 서울 시청 근처
    level: 5,
  },
};
export default meta;

type Story = StoryObj<typeof MapView>;

// 기본 지도
export const Default: Story = {};

// 확대 레벨 데모
export const ZoomedIn: Story = {
  args: {
    level: 3,
  },
};

// 다른 도시로 중심 이동 (부산)
export const Busan: Story = {
  args: {
    center: { lat: 35.1796, lng: 129.0756 },
    level: 5,
  },
};

// 광역 뷰 (대한민국 대략 중앙/축소)
export const WideKoreaView: Story = {
  args: {
    center: { lat: 36.5, lng: 127.9 },
    level: 10,
  },
};
