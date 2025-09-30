"use client";

import { useMemo } from "react";
import { Map } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/cn";
import { ExpandedMenu } from "./components/ExpandedMenu";
import type { MapMenuKey, MapMenuProps } from "./types/types";

export default function MapMenu({
  active,
  onChange,
  isDistrictOn,
  onToggleDistrict,
  className,
  poiKinds,
  onChangePoiKinds,
  roadviewVisible,
  onToggleRoadview,
  expanded,
  onExpandChange,
}: MapMenuProps) {
  const isExpanded = !!expanded;

  const api = useMemo(
    () => ({
      open: () => onExpandChange?.(true),
      close: () => onExpandChange?.(false),
      toggle: () => onExpandChange?.(!isExpanded),
    }),
    [isExpanded, onExpandChange]
  );

  const handleMenuItemClick = (key: MapMenuKey) => {
    onChange?.(key);
    api.close(); // 항목 누르면 닫기
  };

  return (
    <div className={cn("relative z-[210]", className)}>
      <Button
        type="button"
        variant={isExpanded ? "default" : "outline"}
        size="icon"
        // ✅ 버튼 자체에서만 버블링 차단 (preventDefault 쓰지 않음)
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          api.toggle();
        }}
        className={cn(
          "h-10 w-10 rounded-xl",
          "hover:opacity-100 hover:bg-opacity-100",
          isExpanded ? "shadow-md" : "shadow-sm"
        )}
        aria-label="맵 메뉴 열기"
        aria-pressed={isExpanded}
        data-state={isExpanded ? "on" : "off"}
      >
        <Map className="h-4 w-4" />
      </Button>

      {isExpanded && (
        <ExpandedMenu
          active={active}
          activeSubmenu={"filter"}
          isDistrictOn={isDistrictOn}
          onSubmenuClick={() => {}}
          onMenuItemClick={handleMenuItemClick}
          onToggleDistrict={onToggleDistrict}
          onToggle={api.close}
          poiKinds={poiKinds}
          onChangePoiKinds={onChangePoiKinds}
          roadviewVisible={roadviewVisible}
          onToggleRoadview={onToggleRoadview}
        />
      )}
    </div>
  );
}
