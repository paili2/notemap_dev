"use client";

import { Button } from "@/components/atoms/Button/Button";

type Props = {
  onOpenKN: () => void;
  onOpenFavorites: () => void;
  favoritesCount?: number;
  /** 상단에서 얼마나 내릴지(px). 상단 검색바와 겹치면 늘리세요. */
  mapTypeOffsetTop?: number;
};

export default function TopRightButtons({
  onOpenKN,
  onOpenFavorites,
  favoritesCount = 0,
  mapTypeOffsetTop = 12,
}: Props) {
  return (
    <div
      className="absolute right-3"
      style={{
        top: mapTypeOffsetTop,
        zIndex: 60, // 맵/다른 오버레이보다 높게
        pointerEvents: "none", // 바깥은 통과
      }}
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        <Button type="button" onClick={onOpenKN} title="K&N">
          K&N
        </Button>
      </div>
    </div>
  );
}
