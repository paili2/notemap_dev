"use client";

import { useState } from "react";
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
import { FavoriteGroupItem } from "./FavoriteGroupItem";

interface FavoriteGroupListProps {
  groups: FavoriteGroupWithPinNames[];
}

export function FavoriteGroupList({ groups }: FavoriteGroupListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-muted-foreground">
        목록이 비어있습니다
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <FavoriteGroupItem
          key={group.id}
          group={group}
          isExpanded={expandedGroups.has(group.id)}
          onToggle={() => toggleGroup(group.id)}
        />
      ))}
    </div>
  );
}
