// media/persistToServer.ts
import { createPhotoGroup } from "@/shared/api/photoGroups";
import { uploadPhotosAndGetUrls } from "@/shared/api/photoUpload";
import { createPhotosInGroup } from "@/shared/api/photos";

/** 가로(카드) 그룹 저장: 그대로 */
export async function persistCardToServer(args: {
  pinId: number | string;
  title?: string | null;
  files: File[];
  groupSortOrder?: number;
  makePhotoSortOrderFrom?: number;
  setAsCover?: boolean;
}) {
  const {
    pinId,
    title,
    files,
    groupSortOrder = 0,
    makePhotoSortOrderFrom = 0,
    setAsCover = false,
  } = args;

  const group = await createPhotoGroup({
    pinId,
    title: title ?? undefined,
    sortOrder: groupSortOrder,
  });

  const urls = await uploadPhotosAndGetUrls(files, { domain: "map" });
  if (urls.length) {
    const sortOrders = urls.map((_, i) => makePhotoSortOrderFrom + i);
    await createPhotosInGroup(String(group.id), {
      urls,
      sortOrders,
      isCover: setAsCover || false,
    });
  }
  return group;
}

/** ✅ 세로(파일) 그룹 저장: 제목 prefix로 세로 그룹임을 표시 */
export async function persistVerticalGroupToServer(args: {
  pinId: number | string;
  title?: string | null;
  files: File[];
  groupSortOrder?: number;
}) {
  const { pinId, title, files, groupSortOrder = 0 } = args;

  // 세로 그룹임을 식별할 마커
  const VERT_PREFIX = "__V__";

  const group = await createPhotoGroup({
    pinId,
    title: `${VERT_PREFIX}${title ?? ""}`,
    sortOrder: groupSortOrder,
  });

  const urls = await uploadPhotosAndGetUrls(files, { domain: "map" });
  if (urls.length) {
    const sortOrders = urls.map((_, i) => i);
    await createPhotosInGroup(String(group.id), {
      urls,
      sortOrders,
      isCover: false,
    });
  }
  return group;
}
