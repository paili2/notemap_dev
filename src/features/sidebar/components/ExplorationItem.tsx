"use client";

import { X, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/atoms/Button/Button";
import type { ListItem } from "../types/sidebar";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
function formatISODate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return iso || "";
  const dt = new Date(y, m - 1, d);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}(${
    WEEK[dt.getDay()]
  })`;
}

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
  const isDragging = draggedItem === item.id;

  return (
    <div
      // ✅ key 제거 (map 호출하는 부모에서만 필요)
      role="listitem"
      aria-grabbed={isDragging}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => {
        // ✅ 드롭 허용을 위해 기본동작 억제
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => onDrop(e, item.id)}
      className={cn(
        "group flex items-start gap-2 p-1.5 rounded-md border border-transparent transition-colors",
        "hover:bg-gray-100 hover:border-gray-300 cursor-move",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical
        className={cn(
          "mt-0.5 h-3 w-3 text-muted-foreground group-hover:text-gray-700",
          "cursor-grab active:cursor-grabbing" // ✅ UX
        )}
        aria-hidden="true"
      />

      {/* 제목 + 날짜 */}
      <div className="flex-1 min-w-0 leading-tight">
        <div
          className="text-xs text-gray-700 group-hover:text-gray-900 truncate"
          title={item.title} // ✅ 전체 텍스트 툴팁
        >
          {item.title}
        </div>
        {item.dateISO && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatISODate(item.dateISO)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          aria-label="위로"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-gray-200"
          onClick={() => onMoveItem(item.id, "up")}
          disabled={index === 0}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          aria-label="아래로"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-gray-200"
          onClick={() => onMoveItem(item.id, "down")}
          disabled={index === totalItems - 1}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          aria-label="삭제"
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
