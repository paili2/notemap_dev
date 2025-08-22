import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Button } from "@/components/atoms/Button/Button";
import { MapPinTooltip } from "@/components/organisms/MapPinTooltip/MapPinTooltip";
import { MapPin } from "lucide-react";

const meta: Meta<typeof MapPinTooltip> = {
  title: "Molecules/MapPinTooltip",
  component: MapPinTooltip,
  parameters: { layout: "centered" },
  argTypes: {
    mode: { control: { type: "radio" }, options: ["hover", "click"] },
    side: {
      control: { type: "radio" },
      options: ["top", "right", "bottom", "left"],
    },
    align: { control: { type: "radio" }, options: ["start", "center", "end"] },
    sideOffset: { control: { type: "number", min: 0, step: 1 } },
  },
};
export default meta;

type Story = StoryObj<typeof MapPinTooltip>;

const DemoTrigger = ({ label = "핀" }) => (
  <Button variant="secondary" className="gap-1">
    <MapPin className="h-4 w-4" /> {label}
  </Button>
);

export const HoverBasic: Story = {
  args: {
    mode: "hover",
    trigger: <DemoTrigger />,
    title: "우삼겹닭갈비 매장 2층",
    priceText: "월세 150 / 20",
    status: "available",
    address: "경기 고양시 일산동구 라페스타 A동 2층",
    distanceText: "1.2km",
    tags: ["즉시입주", "주차가능", "역세권"],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=640",
    favorite: false,
  },
};

export const Clickable: Story = {
  args: {
    ...HoverBasic.args,
    mode: "click",
    trigger: <DemoTrigger label="핀(클릭)" />,
  },
};

export const FavoriteState: Story = {
  render: (args) => {
    const [fav, setFav] = React.useState(false);
    return (
      <MapPinTooltip
        {...args}
        favorite={fav}
        onToggleFavorite={(next) => setFav(next)}
        trigger={<DemoTrigger label={fav ? "★ 핀" : "핀"} />}
      />
    );
  },
  args: {
    ...HoverBasic.args,
    title: "테스트 매물",
  },
};

export const LongText: Story = {
  args: {
    mode: "hover",
    trigger: <DemoTrigger label="긴 텍스트" />,
    title:
      "[신축] 역세권 대로변 코너 상가 — 남향, 채광좋음, 층고 4.5m, 전면 15m",
    priceText: "보증금 3,000 / 월세 280 (관리비 별도)",
    status: "pending",
    address: "서울특별시 마포구 홍대로 12-34, 2층 201호 (지번: 서교동 123-45)",
    distanceText: "450m",
    tags: ["코너", "층고4.5m", "전면15m", "신축", "승강기"],
    thumbnailUrl: "",
    favorite: true,
  },
};
