import { useState } from "react";

export const useMapMenuState = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<"filter" | "edit" | null>(
    "filter" // 필터를 기본으로 펼쳐진 상태로 설정
  );

  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
    // 메뉴가 열릴 때 필터 상태를 유지
    if (!isExpanded) {
      setActiveSubmenu("filter");
    }
  };

  const handleSubmenuClick = (submenu: "filter" | "edit") => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
  };

  const handleToggle = () => {
    setActiveSubmenu("filter");
  };

  return {
    isExpanded,
    activeSubmenu,
    handleMainClick,
    handleSubmenuClick,
    handleToggle,
  };
};
