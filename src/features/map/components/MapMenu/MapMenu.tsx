"use client";

import { Map, Home } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import { ExpandedMenu } from "./components/ExpandedMenu";
import { useMapMenuState } from "./hooks/useMapMenuState";
import type { MapMenuKey, MapMenuProps } from "./types";

// 구옥 아이콘 컴포넌트
const OldHouseIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M16 2C10.48 2 6 6.48 6 12C6 18.5 16 30 16 30C16 30 26 18.5 26 12C26 6.48 21.52 2 16 2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    />
    <text
      x="16"
      y="17"
      textAnchor="middle"
      fill="white"
      fontSize="10"
      fontWeight="bold"
    >
      구
    </text>
  </svg>
);

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
