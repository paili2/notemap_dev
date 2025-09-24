"use client";

import { Map } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/cn";
import { ExpandedMenu } from "./components/ExpandedMenu";
import { useMapMenuState } from "./hooks/useMapMenuState";
import type { MapMenuKey, MapMenuProps } from "./types/types";

export default function MapMenu({
  active,
  onChange,
  isDistrictOn,
  onToggleDistrict,
  className,

  /** ▼ 추가: 주변시설 제어형 props */
  poiKinds,
  onChangePoiKinds,
}: MapMenuProps) {
  const {
    isExpanded,
    activeSubmenu,
    handleMainClick,
    handleSubmenuClick,
    handleToggle,
  } = useMapMenuState();

  const handleMenuItemClick = (key: MapMenuKey) => {
    onChange?.(key);
    handleToggle(); // 열림 상태 유지하려면 이 줄을 주석 처리
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handleMainClick}
        className="h-10 w-10 rounded-xl shadow-sm"
        aria-label="맵 메뉴 열기"
      >
        <Map className="h-4 w-4" />
      </Button>

      {isExpanded && (
        <ExpandedMenu
          active={active}
          activeSubmenu={activeSubmenu}
          isDistrictOn={isDistrictOn}
          onSubmenuClick={handleSubmenuClick}
          onMenuItemClick={handleMenuItemClick}
          onToggleDistrict={onToggleDistrict}
          onToggle={handleToggle}
          /** ▼ 전달 */
          poiKinds={poiKinds}
          onChangePoiKinds={onChangePoiKinds}
        />
      )}
    </div>
  );
}
