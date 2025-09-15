import { ChevronDown, Map, Home } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import type { MapMenuKey } from "../types";

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

const FILTER_MENU_ITEMS = [
  { key: "all" as const, label: "전체", icon: Map },
  { key: "new" as const, label: "신축", icon: Home },
  { key: "old" as const, label: "구옥", icon: OldHouseIcon },
];

interface FilterSectionProps {
  active: MapMenuKey;
  activeSubmenu: "filter" | "edit" | null;
  onSubmenuClick: (submenu: "filter" | "edit") => void;
  onMenuItemClick: (key: MapMenuKey) => void;
}

export const FilterSection = ({
  active,
  activeSubmenu,
  onSubmenuClick,
  onMenuItemClick,
}: FilterSectionProps) => {
  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSubmenuClick("filter")}
        className="h-8 justify-between text-gray-700 hover:bg-gray-100"
      >
        <span className="text-xs">필터</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            activeSubmenu === "filter" && "rotate-180"
          )}
        />
      </Button>

      {activeSubmenu === "filter" && (
        <div className="mx-3 space-y-0.5">
          {FILTER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                onClick={() => onMenuItemClick(item.key)}
                className={cn(
                  "h-7 w-full justify-start p-1 text-xs",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="h-3 w-3 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};
