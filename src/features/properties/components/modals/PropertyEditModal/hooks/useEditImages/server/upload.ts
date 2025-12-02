import type {
  IdLike,
  PinPhoto,
  PinPhotoGroup,
} from "@/shared/api/types/pinPhotos";
import { createPhotoGroup as apiCreatePhotoGroup } from "@/shared/api/photoGroups";
import { createPhotosInGroup } from "@/shared/api/photos";
import { filesSignature } from "../utils/signature";

/**
 * 특정 그룹에 파일 업로드 + PinPhoto 생성
 */
export async function uploadToGroupImpl(
  groupId: IdLike,
  files: File[] | FileList,
  uploadInFlightMap: Map<string, Promise<PinPhoto[]>>,
  opts?: { domain?: "map" | "contracts" | "board" | "profile" | "etc" }
): Promise<PinPhoto[]> {
  if (!files || Array.from(files as File[]).length === 0) return [];

  const sig = filesSignature(files);
  const key = `${String(groupId)}::${sig}`;
  const existed = uploadInFlightMap.get(key);
  if (existed) return existed;

  const work = (async () => {
    const { uploadPhotosAndGetUrls } = await import("@/shared/api/photoUpload");
    const urls = await uploadPhotosAndGetUrls(files, {
      domain: opts?.domain ?? "map",
    });
    if (!urls.length) return [];
    const created = await createPhotosInGroup(groupId, {
      urls,
      sortOrders: urls.map((_, i: number) => i),
    });
    return created;
  })();

  uploadInFlightMap.set(key, work);
  try {
    return await work;
  } finally {
    uploadInFlightMap.delete(key);
  }
}

/**
 * 그룹을 새로 만들고 그 그룹에 파일 업로드
 */
export async function createGroupAndUploadImpl(
  pinId: IdLike,
  title: string,
  files: File[] | FileList,
  sortOrder: number | null | undefined,
  uploadInFlightMap: Map<string, Promise<PinPhoto[]>>,
  createAndUploadMap: Map<
    string,
    Promise<{ group: PinPhotoGroup; photos: PinPhoto[] }>
  >
): Promise<{ group: PinPhotoGroup; photos: PinPhoto[] }> {
  const sig = files ? filesSignature(files) : "";
  const key = `${String(pinId)}::${title}::${String(sortOrder ?? "")}::${sig}`;
  const existed = createAndUploadMap.get(key);
  if (existed) return existed;

  const work = (async () => {
    const group = await apiCreatePhotoGroup({
      pinId,
      title,
      sortOrder: sortOrder ?? null,
    });
    const photos = files
      ? await uploadToGroupImpl(group.id, files, uploadInFlightMap)
      : [];
    return { group, photos };
  })();

  createAndUploadMap.set(key, work);
  try {
    return await work;
  } finally {
    createAndUploadMap.delete(key);
  }
}
