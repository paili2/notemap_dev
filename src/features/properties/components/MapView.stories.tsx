import type { Meta, StoryObj } from "@storybook/react";
import { MapView } from "@/features/properties/components/MapView";

// ✅ env 읽기 (Next/Vite 모두 대응)
const KEY =
  (process.env.NEXT_PUBLIC_KAKAO_MAP_KEY as string) ||
  ((import.meta as any).env?.NEXT_PUBLIC_KAKAO_MAP_KEY as string) ||
  "";

// (선택) 빈 값이면 눈에 띄게 경고
if (!KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[MapView] NEXT_PUBLIC_KAKAO_MAP_KEY가 비어있어요. .env.local과 Storybook 설정을 확인하세요."
  );
}

const meta: Meta<typeof MapView> = {
  title: "organisms/MapView",
  component: MapView,
  parameters: { layout: "fullscreen" },
  argTypes: {
    appKey: { control: false, table: { disable: true } },
    onMarkerClick: { action: "marker-click" },
    onMapClick: { action: "map-click" },
  },
};
export default meta;

type Story = StoryObj<typeof MapView>;

const SEOUL = { lat: 37.5665, lng: 126.978 };

export const Default: Story = {
  args: {
    appKey: KEY,
    title: "스토리북 지도",
    center: SEOUL,
    level: 5,
    markers: [
      { id: "cityhall", position: SEOUL, title: "서울시청" },
      {
        id: "deoksu",
        position: { lat: 37.5658, lng: 126.9753 },
        title: "덕수궁",
      },
    ],
    fitToMarkers: true,
  },
};

export const SingleMarker: Story = {
  args: {
    appKey: KEY,
    title: "단일 마커",
    center: SEOUL,
    level: 3,
    markers: [{ id: "cityhall", position: SEOUL, title: "서울시청" }],
  },
};

export const ClickHandlers: Story = {
  args: {
    appKey: KEY,
    title: "클릭 핸들러 예시",
    center: SEOUL,
    level: 5,
    markers: [
      { id: "a", position: SEOUL, title: "서울시청" },
      {
        id: "b",
        position: { lat: 37.5702, lng: 126.982 },
        title: "덕수궁 돌담길",
      },
    ],
    fitToMarkers: true,
  },
};
