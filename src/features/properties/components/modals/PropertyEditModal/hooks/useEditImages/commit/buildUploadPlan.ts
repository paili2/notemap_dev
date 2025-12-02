import type { ImageItem } from "@/features/properties/types/media";
import { getServerPhotoId } from "../utils/getServerPhotoId";

export type NewUploadPlan = {
  folderIdx: number;
  files: File[];
  captions: (string | undefined)[];
};

export type VerticalNewItem = {
  img: ImageItem;
  idx: number;
};

/** 가로 신규파일 업로드 계획 생성 */
export function buildFolderUploadPlans(
  folders: ImageItem[][]
): NewUploadPlan[] {
  const result: NewUploadPlan[] = [];

  folders.forEach((folder, idx) => {
    const newItems = (folder ?? []).filter(
      (it: any) => !getServerPhotoId(it) && it.file instanceof File
    );

    if (!newItems.length) return;

    result.push({
      folderIdx: idx,
      files: newItems.map((it: any) => it.file as File),
      captions: newItems.map((it: any) =>
        typeof it.caption === "string" ? it.caption : undefined
      ),
    });
  });

  return result;
}

/** 세로 신규 아이템 추출 */
export function buildVerticalNewItems(
  verticalImages: ImageItem[]
): VerticalNewItem[] {
  return verticalImages
    .map((img, idx) => ({ img, idx }))
    .filter(({ img }) => !getServerPhotoId(img));
}
