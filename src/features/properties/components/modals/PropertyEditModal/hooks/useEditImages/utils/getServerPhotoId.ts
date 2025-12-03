import type { IdLike } from "@/shared/api/photos/types";
import type { ImageItem } from "@/features/properties/types/media";

/**
 * 서버 photoId 추출
 */
export function getServerPhotoId(
  item?: Partial<ImageItem> | null
): IdLike | undefined {
  if (!item) return undefined as any;
  const cand =
    (item as any)?.id ??
    (item as any)?.photoId ??
    (item as any)?.serverId ??
    (item as any)?.pinPhotoId;

  if (cand === 0 || !!cand) return cand as IdLike;
  return undefined as any;
}
