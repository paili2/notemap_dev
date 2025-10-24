"use client";

import { useState, useMemo, useId } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader } from "@/components/atoms/Card/Card";
import type { SidebarSectionProps as BaseProps } from "../types/sidebar";
import { FavorateListItem } from "./FavorateListItem";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { ExplorationItem } from "./ExplorationItem";

/** ✅ 드래그 종료 후 최종 순서 id 배열을 알려주는 콜백을 props에 추가 */
type SidebarSectionProps = BaseProps & {
  onReorderIds?: (orderedIds: string[]) => void;
};

const NOOP = () => {};

export function SidebarSection({
  title,
  items = [], // undefined 안전
  nestedItems = [], // 기존 유지
  onItemsChange,
  onDeleteItem,
  onNestedItemsChange,
  onDeleteNestedItem,
  onDeleteSubItem,
  onReorderIds, // ✅ 추가된 콜백
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const headerId = useId();
  const regionId = useId();

  // useDragAndDrop: (items, onItemsChange, onFinalize?)
  const { draggedItem, handleDragStart, handleDragOver, handleDrop, moveItem } =
    useDragAndDrop(items, onItemsChange ?? NOOP, (orderedIds) => {
      // ✅ 드롭/이동 종료 시 최종 순서 id 배열을 상위로 전달
      onReorderIds?.(orderedIds);
    });

  const isEmpty = useMemo(
    () => (items?.length ?? 0) === 0 && (nestedItems?.length ?? 0) === 0,
    [items, nestedItems]
  );

  const nestedNodes = useMemo(
    () =>
      (nestedItems ?? []).map((item) => (
        <FavorateListItem
          key={item.id}
          item={item}
          onItemChange={(updated) => {
            if (!onNestedItemsChange) return;
            const next = nestedItems.map((n) =>
              n.id === updated.id ? updated : n
            );
            onNestedItemsChange(next);
          }}
          onDeleteItem={onDeleteNestedItem ?? NOOP}
          onDeleteSubItem={onDeleteSubItem ?? NOOP}
        />
      )),
    [nestedItems, onNestedItemsChange, onDeleteNestedItem, onDeleteSubItem]
  );

  const flatNodes = useMemo(
    () =>
      (items ?? []).map((item, index) => (
        <ExplorationItem
          key={item.id}
          item={item}
          index={index}
          totalItems={items.length}
          draggedItem={draggedItem}
          onDragStart={handleDragStart} // (e, item.id)
          onDragOver={handleDragOver} // (e)
          onDrop={handleDrop} // (e, targetId)
          onMoveItem={moveItem} // (item.id, "up"/"down")
          onDeleteItem={onDeleteItem}
        />
      )),
    [
      items,
      draggedItem,
      handleDragStart,
      handleDragOver,
      handleDrop,
      moveItem,
      onDeleteItem,
    ]
  );

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-1">
        <Button
          id={headerId}
          aria-controls={regionId}
          aria-expanded={isExpanded}
          variant="ghost"
          className="w-full justify-start gap-2 p-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setIsExpanded((v) => !v)}
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
        <CardContent
          id={regionId}
          role="region"
          aria-labelledby={headerId}
          className="pt-0 pb-2"
        >
          <div className="space-y-1">
            {/* 즐겨찾기(그룹) */}
            {nestedNodes}

            {/* 비어있을 때 */}
            {isEmpty ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                목록이 비어있습니다
              </p>
            ) : (
              // 답사지 예약(평면 리스트)
              flatNodes
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
