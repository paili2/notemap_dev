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
    // isDocument: false, // 굳이 안 보내도 기본값 false라고 보면 됨
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

/** ✅ 세로(파일) 그룹 저장: isDocument 플래그로 세로 그룹 표시 */
export async function persistVerticalGroupToServer(args: {
  pinId: number | string;
  title?: string | null;
  files: File[];
  groupSortOrder?: number;
}) {
  const { pinId, title, files, groupSortOrder = 0 } = args;

  const group = await createPhotoGroup({
    pinId,
    title: title ?? undefined,
    sortOrder: groupSortOrder,
    isDocument: true, // 🔥 이 값으로 세로(파일) 그룹임을 표시
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
