"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader } from "@/components/atoms/Card/Card";
import type { SidebarSectionProps } from "../types/sidebar";
import { FavorateListItem } from "./FavorateListItem";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { ExplorationItem } from "./ExplorationItem";

export function SidebarSection({
  title,
  items,
  nestedItems = [],
  onItemsChange,
  onDeleteItem,
  onNestedItemsChange,
  onDeleteNestedItem,
  onDeleteSubItem,
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { draggedItem, handleDragStart, handleDragOver, handleDrop, moveItem } =
    useDragAndDrop(items, onItemsChange);

  const handleNestedItemChange = (updatedItem: any) => {
    if (!onNestedItemsChange) return;
    const newItems = nestedItems.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    onNestedItemsChange(newItems);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 p-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-base">{title}</span>
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-2">
          <div className="space-y-1">
            {nestedItems.map((item) => (
              <FavorateListItem
                key={item.id}
                item={item}
                onItemChange={handleNestedItemChange}
                onDeleteItem={onDeleteNestedItem || (() => {})}
                onDeleteSubItem={onDeleteSubItem || (() => {})}
              />
            ))}

            {items.length === 0 && nestedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                목록이 비어있습니다
              </p>
            ) : (
              items.map((item, index) => (
                <ExplorationItem
                  key={item.id}
                  item={item}
                  index={index}
                  totalItems={items.length}
                  draggedItem={draggedItem}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMoveItem={moveItem}
                  onDeleteItem={onDeleteItem}
                />
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
