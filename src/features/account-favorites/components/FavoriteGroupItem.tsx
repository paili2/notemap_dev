"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
interface FavoriteGroupWithPinNames {
  id: string;
  title: string;
  sortOrder: number;
  itemCount?: number;
  items?: Array<{
    itemId: string;
    pinId: string;
    sortOrder: number;
    createdAt: string;
    pinName?: string;
  }>;
}
import { FavoriteSubItemList } from "./FavoriteSubItemList";

interface FavoriteGroupItemProps {
  group: FavoriteGroupWithPinNames;
  isExpanded: boolean;
  onToggle: () => void;
}

export function FavoriteGroupItem({
  group,
  isExpanded,
  onToggle,
}: FavoriteGroupItemProps) {
  const itemCount = group.itemCount ?? group.items?.length ?? 0;

  return (
    <div className="space-y-0.5">
      <div className="group flex items-center gap-2 p-1.5 rounded-md border border-transparent transition-colors hover:bg-gray-200/50 hover:border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-gray-200"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        <span className="flex-1 text-xs font-medium text-gray-700 group-hover:text-gray-900 break-words leading-tight">
          {group.title}
        </span>

        <span className="text-xs text-gray-500 pr-1">
          {itemCount}개
        </span>
      </div>

      {isExpanded && group.items && group.items.length > 0 && (
        <FavoriteSubItemList items={group.items} />
      )}
    </div>
  );
}

