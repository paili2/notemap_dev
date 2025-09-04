"use client";

import { X, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button/Button";
import type { ListItem } from "../types/sidebar";

interface ExplorationItemProps {
  item: ListItem;
  index: number;
  totalItems: number;
  draggedItem: string | null;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, itemId: string) => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onDeleteItem: (id: string) => void;
}

export function ExplorationItem({
  item,
  index,
  totalItems,
  draggedItem,
  onDragStart,
  onDragOver,
  onDrop,
  onMoveItem,
  onDeleteItem,
}: ExplorationItemProps) {
  return (
    <div
      key={item.id}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      className={cn(
        "group flex items-center gap-2 p-1.5 rounded-md border border-transparent transition-colors",
        "hover:bg-gray-100 hover:border-gray-300 cursor-move",
        draggedItem === item.id && "opacity-50"
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-gray-700" />

      <span className="flex-1 text-xs text-gray-700 group-hover:text-gray-900 break-words leading-tight">
        {item.title}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-gray-200"
          onClick={() => onMoveItem(item.id, "up")}
          disabled={index === 0}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-gray-200"
          onClick={() => onMoveItem(item.id, "down")}
          disabled={index === totalItems - 1}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onDeleteItem(item.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
