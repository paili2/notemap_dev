"use client";

import { Button } from "@/components/atoms/Button/Button";
import GridTilesIcon from "@/components/atoms/Icons/GridTilesIcon";

type Props = {
  pressed: boolean;
  onPress: () => void;
};
export default function SidebarToggleButton({ pressed, onPress }: Props) {
  return (
    <Button
      type="button"
      onClick={onPress}
      variant={pressed ? "default" : "outline"}
      size="icon"
      className="h-10 w-10 rounded-xl shadow"
      title="사이드바 토글"
      aria-pressed={pressed}
      aria-label="사이드바 토글"
    >
      <GridTilesIcon />
    </Button>
  );
}
