import { api } from "@/shared/api/api";
import type { AxiosRequestConfig } from "axios";
import type {
  IdLike,
  PinPhoto,
  PinPhotoGroup,
  CreatePinPhotoDto,
} from "@/shared/api/types/pinPhotos";

/* ─────────────────────────────────────────────
 * 내부 공용 유틸
 * ───────────────────────────────────────────── */
const toKey = (v: IdLike) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};
const assertArray = <T>(v: unknown, msg: string): T[] => {
  if (!v || !Array.isArray(v)) throw new Error(msg);
  return v as T[];
};

/* =========================
 * /photo-groups CRUD (조회만)
 * ========================= */

/** 목록: GET /photo-groups/:pinId */
export async function listPhotoGroupsByPin(
  pinId: IdLike,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup[]> {
  const pinKey = toKey(pinId);

  const { data } = await api.get<{ data?: PinPhotoGroup[]; message?: string }>(
    `/photo-groups/${encodeURIComponent(String(pinKey))}`,
    { withCredentials: true, ...(config ?? {}) }
  );

  const groups = assertArray<PinPhotoGroup>(
    data?.data,
    data?.message || "사진 그룹 조회 실패"
  );
  return groups;
}

/* =========================
 * 그룹 내 사진 CRUD
 * ========================= */

/** 목록: GET /photos/:groupId  */
export async function listGroupPhotos(
  groupId: IdLike,
  config?: AxiosRequestConfig
): Promise<PinPhoto[]> {
  const gidKey = toKey(groupId);

  const { data } = await api.get<{ data?: PinPhoto[]; message?: string }>(
    `/photos/${encodeURIComponent(String(gidKey))}`,
    { withCredentials: true, ...(config ?? {}) }
  );

  const photos = assertArray<PinPhoto>(
    data?.data,
    data?.message || "사진 목록 조회 실패"
  );
  return photos;
}

/* ─────────────────────────────────────────────
 * In-flight dedupe for createPhotosInGroup
 * 동일 (groupId, urls, sortOrders, isCover) 재호출 방지
 * ───────────────────────────────────────────── */
type InflightKey = string;
type InflightEntry = Promise<PinPhoto[]>;
const inflightCreate = new Map<InflightKey, InflightEntry>();

function createKey(groupId: IdLike, body: CreatePinPhotoDto): InflightKey {
  const gid = String(groupId);
  const urlsSig = Array.isArray(body.urls) ? body.urls.join(",") : "";
  const soSig = Array.isArray(body.sortOrders) ? body.sortOrders.join(",") : "";
  const cover = body.isCover ? "1" : "0";
  return `${gid}::${urlsSig}::${soSig}::${cover}`;
}

/** 등록(여러 장): POST /photos/:groupId
 *  - 업로드는 /photo/upload?domain=map 에서 먼저 수행 → urls[] 획득
 *  - 여기서는 그 urls를 그룹에 등록
 */
export async function createPhotosInGroup(
  groupId: IdLike,
  body: CreatePinPhotoDto, // { urls: string[], sortOrders?: number[], isCover?: boolean }
  config?: AxiosRequestConfig
): Promise<PinPhoto[]> {
  // 가벼운 사전 검증: urls 필수
  if (!body?.urls?.length) {
    throw new Error("사진 등록 실패: urls가 비어 있습니다.");
  }

  const key = createKey(groupId, body);
  const existed = inflightCreate.get(key);
  if (existed) return existed;

  const gidKey = toKey(groupId);

  const work = (async () => {
    const { data } = await api.post<{ data?: PinPhoto[]; message?: string }>(
      `/photos/${encodeURIComponent(String(gidKey))}`,
      body,
      { withCredentials: true, ...(config ?? {}) }
    );

    const photos = assertArray<PinPhoto>(
      data?.data,
      data?.message || "사진 등록 실패"
    );
    return photos;
  })();

  inflightCreate.set(key, work);
  try {
    return await work;
  } finally {
    inflightCreate.delete(key);
  }
}

/** 일괄 수정: PATCH /photos
 * - 필요한 값만 보냄: isCover, sortOrder, moveGroupId
 */
export type UpdatePhotosBody = {
  photoIds: IdLike[];
  isCover?: boolean;
  sortOrder?: number;
  moveGroupId?: IdLike | null;
};

export async function updatePhotos(
  body: UpdatePhotosBody,
  config?: AxiosRequestConfig
): Promise<PinPhoto[]> {
  // moveGroupId 숫자 보정
  const normalizedBody: UpdatePhotosBody = {
    ...body,
    moveGroupId:
      body.moveGroupId === null || body.moveGroupId === undefined
        ? body.moveGroupId ?? null
        : toKey(body.moveGroupId),
  };

  const { data } = await api.patch<{ data?: PinPhoto[]; message?: string }>(
    `/photos`,
    normalizedBody,
    { withCredentials: true, ...(config ?? {}) }
  );

  const photos = assertArray<PinPhoto>(
    data?.data,
    data?.message || "사진 수정 실패"
  );
  return photos;
}

/** 일괄 삭제: DELETE /photos */
export async function deletePhotos(
  photoIds: IdLike[],
  config?: AxiosRequestConfig
): Promise<{ affected: number }> {
  const { data } = await api.delete<{
    data?: { affected: number };
    message?: string;
  }>(`/photos`, {
    data: { photoIds }, // axios delete 본문 전송 시 data 키 사용
    withCredentials: true,
    ...(config ?? {}),
  });

  const result = data?.data;
  if (!result || typeof result.affected !== "number") {
    throw new Error(data?.message || "사진 삭제 실패");
  }
  return result;
}
