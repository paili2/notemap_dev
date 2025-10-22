import { useState } from "react";

type FinalizeFn<T> = (orderedIds: string[], orderedItems: T[]) => void;

export function useDragAndDrop<T extends { id: string }>(
  items: T[],
  onItemsChange: (items: T[]) => void,
  onFinalize?: FinalizeFn<T> // ✅ 드롭/이동이 끝난 뒤 최종 순서 전달(선택)
) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItemData);

    onItemsChange(newItems);
    setDraggedItem(null);

    // ✅ 최종 순서 콜백 (서버 재정렬 PATCH에 사용)
    onFinalize?.(
      newItems.map((x) => x.id),
      newItems
    );
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const currentIndex = items.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(newIndex, 0, movedItem);

    onItemsChange(newItems);

    // ✅ 버튼으로 이동해도 동일하게 서버에 반영 가능
    onFinalize?.(
      newItems.map((x) => x.id),
      newItems
    );
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    moveItem,
  };
}
