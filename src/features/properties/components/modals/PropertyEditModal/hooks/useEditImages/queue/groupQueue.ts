import type { IdLike } from "@/shared/api/types/pinPhotos";

export type PendingGroupChange = {
  id: IdLike | string;
  title?: string | null;
  sortOrder?: number | null;
};

/**
 * group 변경 큐 조작 util
 */
export function queueGroupTitle(
  pendingGroupMap: Map<string, PendingGroupChange>,
  groupId: IdLike,
  title: string | null
) {
  const key = String(groupId);
  const prev = pendingGroupMap.get(key) ?? { id: groupId };
  pendingGroupMap.set(key, { ...prev, title });
}

export function queueGroupSortOrder(
  pendingGroupMap: Map<string, PendingGroupChange>,
  groupId: IdLike,
  sortOrder: number | null
) {
  const key = String(groupId);
  const prev = pendingGroupMap.get(key) ?? { id: groupId };
  pendingGroupMap.set(key, { ...prev, sortOrder });
}

/** 가짜 키("folder-0")로 들어간 제목 읽기 */
export function getQueuedFolderTitle(
  pendingGroupMap: Map<string, PendingGroupChange>,
  folderIdx: number
): string | null {
  const pseudoKey = `folder-${folderIdx}`;
  const pending = pendingGroupMap.get(pseudoKey);
  const t = pending?.title;
  if (typeof t === "string" && t.trim().length > 0) return t.trim();
  return null;
}

export function consumeQueuedFolderTitle(
  pendingGroupMap: Map<string, PendingGroupChange>,
  folderIdx: number
) {
  const pseudoKey = `folder-${folderIdx}`;
  pendingGroupMap.delete(pseudoKey);
}

/** 세로 폴더용 가짜 키("__vertical__") 읽기 */
export function getQueuedVerticalTitle(
  pendingGroupMap: Map<string, PendingGroupChange>
): string | null {
  const pending = pendingGroupMap.get("__vertical__");
  const t = pending?.title;
  if (typeof t === "string" && t.trim().length > 0) return t.trim();
  return null;
}

export function consumeQueuedVerticalTitle(
  pendingGroupMap: Map<string, PendingGroupChange>
) {
  pendingGroupMap.delete("__vertical__");
}
