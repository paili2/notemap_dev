import { ChevronDown, Map, Home } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import type { MapMenuKey } from "../types/types";

const FILTER_MENU_ITEMS = [
  { key: "all" as const, label: "전체", icon: Map },
  { key: "new" as const, label: "신축", icon: Home },
  { key: "old" as const, label: "구옥", icon: "/pins/oldhouse-pin.svg" },
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
                {typeof item.icon === "string" ? (
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="h-3 w-3 mr-2"
                  />
                ) : (
                  <item.icon className="h-3 w-3 mr-2" />
                )}
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};
