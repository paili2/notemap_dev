// features/map/top/MapQuickControls/MapQuickControls.tsx
"use client";

import DistrictToggleButton from "./components/DistrictToggleButton";
import type { MapQuickControlsProps } from "./types";

export default function MapQuickControls({
  isDistrictOn,
  onToggleDistrict,
  offsetTopPx = 12,
}: MapQuickControlsProps) {
  return (
    <div
      className="absolute right-3"
      style={{ top: offsetTopPx, zIndex: 90, pointerEvents: "none" }}
    >
      <div className="flex items-center gap-2 pointer-events-auto">
        <DistrictToggleButton
          pressed={isDistrictOn}
          onPress={onToggleDistrict}
        />
      </div>
    </div>
  );
}
