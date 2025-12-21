"use client";

interface FavoriteItemWithName {
  itemId: string;
  pinId: string;
  sortOrder: number;
  createdAt: string;
  pinName?: string;
}

interface FavoriteSubItemListProps {
  items: FavoriteItemWithName[];
}

export function FavoriteSubItemList({ items }: FavoriteSubItemListProps) {
  return (
    <div className="ml-3 space-y-0.5">
      {items.map((item) => (
        <div
          key={item.itemId}
          className="group flex items-center gap-2 p-1 rounded-md border border-transparent transition-colors hover:bg-gray-100 hover:border-gray-300"
        >
          <div className="w-2 h-px bg-muted-foreground/30" />
          <span className="flex-1 text-xs text-gray-600 group-hover:text-gray-900 break-words leading-tight">
            {item.pinName || `Pin ${item.pinId}`}
          </span>
        </div>
      ))}
    </div>
  );
}

