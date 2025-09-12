"use client";

import DistrictToggleButton from "./components/DistrictToggleButton/DistrictToggleButton";
import type { MapQuickControlsProps } from "./types";
import { cn } from "@/lib/utils"; // tailwind merge 유틸 (이미 쓰고 계시죠)

export default function MapQuickControls({
  isDistrictOn,
  onToggleDistrict,
  offsetTopPx = 12,
  offsetRightPx = 12,
  zIndex = 11000,
  className,
  style,
  dataTestId,
}: MapQuickControlsProps) {
  return (
    <div
      className={cn("absolute pointer-events-none", className)}
      style={{ top: offsetTopPx, right: offsetRightPx, zIndex, ...style }}
      data-testid={dataTestId}
    >
      <div className="flex items-center gap-2 pointer-events-auto">
        <DistrictToggleButton
          pressed={isDistrictOn}
          onPress={() => onToggleDistrict(!isDistrictOn)}
        />
      </div>
    </div>
  );
}
