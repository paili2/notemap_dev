"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Pencil, Check } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { FavorateListItem as FavorateListItemType } from "../types/sidebar";
import { SubList } from "./SubList";

interface FavorateListItemProps {
  item: FavorateListItemType;
  onItemChange: (item: FavorateListItemType) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSubItem: (parentId: string, subId: string) => void;
  onUpdateTitle?: (groupId: string, newTitle: string) => Promise<void>;

  /** ✅ 즐겨찾기 하위 매물 클릭 시 상위로 전달 */
  onFocusSubItemMap?: (
    subItem: FavorateListItemType["subItems"][number]
  ) => void;
}

export function FavorateListItem({
  item,
  onItemChange,
  onDeleteItem,
  onDeleteSubItem,
  onUpdateTitle,
  onFocusSubItemMap,
}: FavorateListItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubItemsChange = (newSubItems: any[]) => {
    onItemChange({ ...item, subItems: newSubItems });
  };

  const handleDeleteSubItem = (subId: string) => {
    onDeleteSubItem(item.id, subId);
  };

  const handleStartEdit = () => {
    setEditValue(item.title);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditValue(item.title);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      handleCancelEdit();
      return;
    }

    if (trimmedValue === item.title) {
      setIsEditing(false);
      return;
    }

    if (onUpdateTitle) {
      try {
        isSavingRef.current = true;
        await onUpdateTitle(item.id, trimmedValue);
        setIsEditing(false);
      } catch (error) {
        // 에러는 onUpdateTitle에서 toast로 표시됨
        handleCancelEdit();
      } finally {
        isSavingRef.current = false;
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isSavingRef.current) return;

    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest("button")) {
      return;
    }

    handleCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-0.5">
      <div className="group flex items-center gap-2 p-1.5 rounded-md border border-transparent transition-colors hover:bg-gray-200/50 hover:border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-gray-200"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isEditing}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 h-6 text-xs px-2 py-1"
            maxLength={32}
          />
        ) : (
          <span className="flex-1 text-xs font-medium text-gray-700 group-hover:text-gray-900 break-words leading-tight">
            {item.title}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:shadow-sm"
              onClick={handleSaveEdit}
            >
              <Check className="h-2.5 w-2.5" />
            </Button>
          ) : (
            <>
              {onUpdateTitle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:shadow-sm"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:shadow-sm"
                onClick={() => onDeleteItem(item.id)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isExpanded && item.subItems.length > 0 && (
        <SubList
          items={item.subItems}
          onItemsChange={handleSubItemsChange}
          onDeleteItem={handleDeleteSubItem}
          // ✅ 각 subItem 클릭 시 상위 콜백
          onClickItem={onFocusSubItemMap}
        />
      )}
    </div>
  );
}
