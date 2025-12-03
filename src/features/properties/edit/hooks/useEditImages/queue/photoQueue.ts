import type { IdLike } from "@/shared/api/photos/types";

export type PendingPhotoChange = {
  id: IdLike;
  caption?: string | null;
  groupId?: IdLike | null;
  sortOrder?: number | null;
  isCover?: boolean | null;
  name?: string | null;
};

export function queuePhotoCaption(
  pendingPhotoMap: Map<string, PendingPhotoChange>,
  photoId: IdLike,
  text: string | null
) {
  const key = String(photoId);
  const prev = pendingPhotoMap.get(key) ?? { id: photoId };
  pendingPhotoMap.set(key, { ...prev, caption: text ?? null });
}

export function queuePhotoSort(
  pendingPhotoMap: Map<string, PendingPhotoChange>,
  photoId: IdLike,
  sortOrder: number | null
) {
  const key = String(photoId);
  const prev = pendingPhotoMap.get(key) ?? { id: photoId };
  pendingPhotoMap.set(key, { ...prev, sortOrder });
}

export function queuePhotoMove(
  pendingPhotoMap: Map<string, PendingPhotoChange>,
  photoId: IdLike,
  destGroupId: IdLike | null
) {
  const key = String(photoId);
  const prev = pendingPhotoMap.get(key) ?? { id: photoId };
  pendingPhotoMap.set(key, { ...prev, groupId: destGroupId });
}

export function markCover(
  pendingPhotoMap: Map<string, PendingPhotoChange>,
  photoId: IdLike
) {
  const key = String(photoId);
  const prev = pendingPhotoMap.get(key) ?? { id: photoId };
  pendingPhotoMap.set(key, { ...prev, isCover: true });
}
