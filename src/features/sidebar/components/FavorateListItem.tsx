"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import type { FavorateListItem } from "../types/sidebar";
import { SubList } from "./SubList";

interface FavorateListItemProps {
  item: FavorateListItem;
  onItemChange: (item: FavorateListItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSubItem: (parentId: string, subId: string) => void;
}

export function FavorateListItem({
  item,
  onItemChange,
  onDeleteItem,
  onDeleteSubItem,
}: FavorateListItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubItemsChange = (newSubItems: any[]) => {
    onItemChange({ ...item, subItems: newSubItems });
  };

  const handleDeleteSubItem = (subId: string) => {
    onDeleteSubItem(item.id, subId);
  };

  return (
    <div className="space-y-0.5">
      <div className="group flex items-center gap-2 p-1.5 rounded-md border border-transparent transition-colors hover:bg-gray-100 hover:border-gray-300">
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-gray-200"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        <span className="flex-1 text-xs font-medium text-gray-700 group-hover:text-gray-900 break-words leading-tight">
          {item.title}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDeleteItem(item.id)}
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {isExpanded && item.subItems.length > 0 && (
        <SubList
          items={item.subItems}
          onItemsChange={handleSubItemsChange}
          onDeleteItem={handleDeleteSubItem}
        />
      )}
    </div>
  );
}
