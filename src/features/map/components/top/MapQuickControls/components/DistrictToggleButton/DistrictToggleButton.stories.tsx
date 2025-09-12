// src/features/map/components/pincontextmenu/top/mapquickcontrols/components/DistrictToggleButton.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import DistrictToggleButton from "./DistrictToggleButton";
import useKakaoMap from "@/features/map/components/MapView/hooks/useKakaoMap";
import { useDistrictOverlay } from "@/features/map/components/MapView/hooks/useDistrictOverlay";

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "YOUR_KEY";

const meta: Meta<typeof DistrictToggleButton> = {
  title: "features/map/controls/DistrictToggleButton",
  component: DistrictToggleButton,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "지적편집도 오버레이를 토글하는 버튼. 실제 카카오 지도와 함께 동작을 확인합니다.",
      },
    },
  },
  decorators: [
    // 공통 높이 래퍼
    (Story) => (
      <div
        style={{
          height: "70vh",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DistrictToggleButton>;

const MapWithDistrictToggle: React.FC = () => {
  const [pressed, setPressed] = React.useState(false);

  const { containerRef, kakao, map } = useKakaoMap({
    appKey: APP_KEY,
    center: { lat: 37.5665, lng: 126.978 }, // 서울 시청
    level: 5,
    fitKoreaBounds: false,
    maxLevel: 11,
  });

  // 지적편집도 on/off
  useDistrictOverlay(kakao as any, map as any, pressed);

  if (APP_KEY === "YOUR_KEY") {
    return (
      <div className="flex h-full items-center justify-center text-sm">
        ❗ `.env.local`에 <code>NEXT_PUBLIC_KAKAO_MAP_KEY</code>를 설정하세요.
      </div>
    );
  }

  return (
    <>
      {/* 지도 */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* 우상단 토글 버튼 */}
      <div className="absolute right-4 top-4 z-10">
        <DistrictToggleButton
          pressed={pressed}
          onPress={() => setPressed((v) => !v)}
        />
      </div>
    </>
  );
};

export const Demo: Story = {
  render: () => <MapWithDistrictToggle />,
};
