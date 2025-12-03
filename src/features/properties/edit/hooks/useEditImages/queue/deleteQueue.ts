import type { ImageItem } from "@/features/properties/types/media";
import { getServerPhotoId } from "../utils/getServerPhotoId";

export function queueDeleteId(
  pendingDeleteSet: Set<string>,
  id: string | number | null | undefined
) {
  if (id == null) return;
  pendingDeleteSet.add(String(id));
}

/** ImageItem 이 서버 사진이면 delete 큐에 추가 */
export function queueDeleteIfServerItem(
  pendingDeleteSet: Set<string>,
  item?: ImageItem
) {
  const id = getServerPhotoId(item);
  if (id != null) queueDeleteId(pendingDeleteSet, id as any);
}
