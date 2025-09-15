"use client";

import { Map, Home } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import { ExpandedMenu } from "./components/ExpandedMenu";
import { useMapMenuState } from "./hooks/useMapMenuState";
import type { MapMenuKey, MapMenuProps } from "./types/types";

export default function MapMenu({
  active,
  onChange,
  isDistrictOn,
  onToggleDistrict,
  className,
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
    // 메뉴를 닫지 않고 열린 상태 유지
    // setIsExpanded(false);
    // 필터 상태는 유지
    handleToggle();
  };

  return (
    <div className={cn("relative", className)}>
      {/* 맵 메뉴 버튼 */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleMainClick}
        className="h-10 w-10 rounded-xl shadow-sm"
        aria-label="맵 메뉴 열기"
      >
        <Map className="h-4 w-4" />
      </Button>

      {/* 확장된 메뉴 */}
      {isExpanded && (
        <ExpandedMenu
          active={active}
          activeSubmenu={activeSubmenu}
          isDistrictOn={isDistrictOn}
          onSubmenuClick={handleSubmenuClick}
          onMenuItemClick={handleMenuItemClick}
          onToggleDistrict={onToggleDistrict}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
