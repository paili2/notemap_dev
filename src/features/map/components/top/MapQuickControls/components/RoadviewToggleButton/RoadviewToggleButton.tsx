"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

type Props = {
  pressed: boolean;
  onPress: () => void;
  showLabel?: boolean; // 카드형 여부
  className?: string;
};

export default function RoadviewToggleButton({
  pressed,
  onPress,
  showLabel = false,
  className,
}: Props) {
  if (!showLabel) {
    // QuickControls용 아이콘 버튼
    return (
      <Button
        type="button"
        onClick={onPress}
        variant={pressed ? "default" : "outline"}
        size="icon"
        className={["h-10 w-10 rounded-xl shadow", className]
          .filter(Boolean)
          .join(" ")}
        title="로드뷰 토글"
        aria-pressed={pressed}
        aria-label="로드뷰 토글"
      >
        <Camera aria-hidden="true" className="h-4 w-4" />
      </Button>
    );
  }

  // ExpandedMenu 카드형 버튼
  return (
    <button
      type="button"
      onClick={onPress}
      className={[
        "flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg text-xs border transition",
        pressed
          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
        className ?? "",
      ].join(" ")}
      aria-pressed={pressed}
      title="로드뷰"
      aria-label="로드뷰"
    >
      <Camera className="w-5 h-5" aria-hidden="true" />
      <span>로드뷰</span>
    </button>
  );
}
