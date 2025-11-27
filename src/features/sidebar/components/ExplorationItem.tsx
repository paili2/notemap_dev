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

  /** ✅ 아이템 클릭 시 지도 이동 등 상위에서 처리하고 싶을 때 */
  onFocusMap?: (item: ListItem) => void;
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
  onFocusMap,
}: ExplorationItemProps) {
  const isDragging = draggedItem === item.id;

  const handleClickRow = () => {
    // 드래그 중에는 클릭 액션 무시
    if (isDragging) return;
    onFocusMap?.(item);
  };

  return (
    <div
      role="listitem"
      aria-grabbed={isDragging}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => {
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
          "cursor-grab active:cursor-grabbing"
        )}
        aria-hidden="true"
      />

      {/* 제목 + 날짜 (👈 이 영역 클릭 시 지도 이동 콜백 호출) */}
      <button
        type="button"
        className="flex-1 min-w-0 text-left leading-tight cursor-pointer"
        onClick={handleClickRow}
      >
        <div
          className="text-xs text-gray-700 group-hover:text-gray-900 truncate"
          title={item.title}
        >
          {item.title}
        </div>
        {item.dateISO && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatISODate(item.dateISO)}
          </div>
        )}
      </button>

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
