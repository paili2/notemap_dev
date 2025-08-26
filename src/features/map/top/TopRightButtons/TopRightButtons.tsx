"use client";

import KNButton from "./components/KNButton";
import FavoritesButton from "./components/FavoritesButton";
import type { TopRightButtonsProps } from "./types";

export default function TopRightButtons({
  onOpenKN,
  onOpenFavorites,
  favoritesCount = 0,
  mapTypeOffsetTop = 12,
}: TopRightButtonsProps) {
  return (
    <div
      className="absolute right-3"
      style={{
        top: mapTypeOffsetTop,
        zIndex: 60, // 맵/다른 오버레이보다 높게
        pointerEvents: "none", // 바깥은 통과
      }}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <KNButton onClick={onOpenKN} />
        <FavoritesButton count={favoritesCount} onClick={onOpenFavorites} />
      </div>
    </div>
  );
}
