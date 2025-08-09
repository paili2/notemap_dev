import type { Meta, StoryObj } from "@storybook/react";
import { MapView } from "./MapView";

const meta: Meta<typeof MapView> = {
  title: "organisms/MapView",
  component: MapView,
  parameters: { layout: "fullscreen" },
  argTypes: {
    // env로 강제 주입할 거라 컨트롤 막음
    appKey: { control: false, table: { disable: true } },
    // 클릭 이벤트는 스토리북 액션으로 확인
    onMarkerClick: { action: "marker-click" },
    onMapClick: { action: "map-click" },
  },
};
export default meta;

type Story = StoryObj<typeof MapView>;

const SEOUL = { lat: 37.5665, lng: 126.978 };

export const Default: Story = {
  // ⬇️ 여기서 env 키를 강제로 꽂아줌(로컬스토리지 args 오염 방지)
  render: (args) => (
    <MapView
      {...args}
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_KEY as string}
    />
  ),
  args: {
    title: "스토리북 지도",
    center: SEOUL,
    level: 5,
    // MapView가 height prop 지원한다면 사용(없으면 MapView 내부 스타일로)
    // height: "480px",
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
  render: (args) => (
    <MapView
      {...args}
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_KEY as string}
    />
  ),
  args: {
    title: "단일 마커",
    center: SEOUL,
    level: 3,
    markers: [{ id: "cityhall", position: SEOUL, title: "서울시청" }],
  },
};

export const ClickHandlers: Story = {
  render: (args) => (
    <MapView
      {...args}
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_KEY as string}
    />
  ),
  args: {
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
