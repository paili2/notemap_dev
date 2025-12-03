import { createPhotoGroup } from "@/shared/api/photos/photoGroups";
import { uploadPhotosAndGetUrls } from "@/shared/api/photos/photoUpload";
import { createPhotosInGroup } from "@/shared/api/photos/photos";

/** 카드(그룹) 하나를 서버에 저장: 그룹 생성 → 업로드 → 그룹에 URL 등록 */
export async function persistCardToServer(args: {
  pinId: number | string;
  title?: string | null;
  files: File[];
  groupSortOrder?: number; // 카드(그룹) 순서
  makePhotoSortOrderFrom?: number; // 사진 정렬 시작값(옵션)
  setAsCover?: boolean; // 이 카드의 사진들을 전부 대표로(옵션)
}) {
  const {
    pinId,
    title,
    files,
    groupSortOrder = 0,
    makePhotoSortOrderFrom = 0,
    setAsCover = false,
  } = args;

  // 1) 그룹 생성
  const group = await createPhotoGroup({
    pinId,
    title: title ?? undefined,
    sortOrder: groupSortOrder,
  });

  // 2) 업로드 → urls
  const urls = await uploadPhotosAndGetUrls(files, { domain: "map" });

  // 3) 그룹에 URL 등록 (★ 지금 빠져있는 호출)
  if (urls.length > 0) {
    const sortOrders = urls.map((_, i) => makePhotoSortOrderFrom + i);
    await createPhotosInGroup(String(group.id), {
      urls,
      sortOrders,
      isCover: setAsCover || false,
    });
  }

  return group;
}
