"use client";

import { useState, useMemo, useId } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader } from "@/components/atoms/Card/Card";
import type { SidebarSectionProps as BaseProps } from "../types/sidebar";
import { FavorateListItem } from "./FavorateListItem";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { ExplorationItem } from "./ExplorationItem";
import { cn } from "@/lib/cn";

/** ✅ 드래그 종료 후 최종 순서 id 배열을 알려주는 콜백 + 아코디언 제어 + 지도 이동 콜백 */
type SidebarSectionProps = BaseProps & {
  onReorderIds?: (orderedIds: string[]) => void;

  /** 상위에서 열림 상태를 제어하고 싶을 때 사용 (없으면 내부 state 사용) */
  expanded?: boolean;
  onToggleExpanded?: () => void;

  /** ✅ 답사지 예약(평면 리스트) 아이템 클릭 → 지도 이동 */
  onFocusItemMap?: (item: any) => void;

  /** ✅ 즐겨찾기 그룹의 subItem 클릭 → 지도 이동 */
  onFocusSubItemMap?: (subItem: any) => void;
};

const NOOP = () => {};

export function SidebarSection(props: SidebarSectionProps) {
  const {
    title,
    items = [], // undefined 안전
    nestedItems = [], // 기존 유지
    onItemsChange,
    onDeleteItem,
    onNestedItemsChange,
    onDeleteNestedItem,
    onDeleteSubItem,
    onReorderIds, // ✅ 추가된 콜백
    onUpdateGroupTitle,
    expanded: expandedProp,
    onToggleExpanded,

    onFocusItemMap,
    onFocusSubItemMap,
  } = props;

  // 🔹 내부 기본값: 접힌 상태
  const [internalExpanded, setInternalExpanded] = useState(false);

  // 🔹 controlled 여부 판별
  const isControlled = typeof expandedProp === "boolean";
  const isExpanded = isControlled
    ? (expandedProp as boolean)
    : internalExpanded;

  const headerId = useId();
  const regionId = useId();

  const toggleExpanded = () => {
    if (isControlled) {
      onToggleExpanded?.();
    } else {
      setInternalExpanded((v) => !v);
    }
  };

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
          onUpdateTitle={onUpdateGroupTitle}
          // ✅ 즐겨찾기 하위 매물 클릭 → 상위 콜백
          onFocusSubItemMap={onFocusSubItemMap}
        />
      )),
    [
      nestedItems,
      onNestedItemsChange,
      onDeleteNestedItem,
      onDeleteSubItem,
      onUpdateGroupTitle,
      onFocusSubItemMap,
    ]
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
          // ✅ 답사지 예약 아이템 클릭 → 상위 콜백
          onFocusMap={onFocusItemMap}
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
      onFocusItemMap,
    ]
  );

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* 헤더를 버튼처럼 한 줄 카드 형태로 */}
      <CardHeader className="p-0">
        <Button
          id={headerId}
          aria-controls={regionId}
          aria-expanded={isExpanded}
          variant="ghost"
          className="flex h-11 w-full items-center gap-2 px-4 text-gray-700 justify-start hover:bg-gray-50 hover:text-gray-900"
          onClick={toggleExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-base leading-none">{title}</span>
        </Button>
      </CardHeader>

      {/* 🔽 부드러운 열림/닫힘용 래퍼 (항상 렌더) */}
      <CardContent
        id={regionId}
        role="region"
        aria-labelledby={headerId}
        className="pt-0 pb-0"
      >
        <div
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-200 ease-out",
            isExpanded
              ? "max-h-[600px] opacity-100 pt-2 pb-2"
              : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-1">
            {/* 즐겨찾기(그룹) */}
            {nestedNodes}

            {/* 비어있을 때 */}
            {isEmpty ? (
              <p className="py-2 text-center text-sm text-muted-foreground">
                목록이 비어있습니다
              </p>
            ) : (
              // 답사지 예약(평면 리스트)
              flatNodes
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
