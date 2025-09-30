import { useState, useCallback } from "react";

export const useMapMenuState = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<"filter" | "edit" | null>(
    "filter"
  );

  const open = useCallback(() => {
    setIsExpanded(true);
    setActiveSubmenu("filter");
  }, []);

  const close = useCallback(() => {
    setIsExpanded(false);
    setActiveSubmenu("filter");
  }, []);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next) setActiveSubmenu("filter");
      return next;
    });
  }, []);

  const handleSubmenuClick = useCallback((submenu: "filter" | "edit") => {
    setActiveSubmenu((cur) => (cur === submenu ? null : submenu));
  }, []);

  return { isExpanded, activeSubmenu, open, close, toggle, handleSubmenuClick };
};
