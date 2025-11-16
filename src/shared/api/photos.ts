import { api } from "@/shared/api/api";
import type { AxiosError, AxiosRequestConfig } from "axios";
import type {
  IdLike,
  PinPhoto,
  PinPhotoGroup,
  CreatePinPhotoDto,
  CreatePinPhotoGroupDto,
  UpdatePinPhotoGroupDto,
} from "@/shared/api/types/pinPhotos";

/* ───────── 공통 유틸 ───────── */
const toKey = (v: IdLike) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};
const assertArray = <T>(v: unknown, msg: string): T[] => {
  if (!v || !Array.isArray(v)) throw new Error(msg);
  return v as T[];
};
const is409 = (e: unknown) => {
  const err = e as AxiosError<any>;
  return !!(err?.response && err.response.status === 409);
};

/* =========================
 * /photo-groups
 * ========================= */

/** GET /photo-groups/:pinId */
export async function listPhotoGroupsByPin(
  pinId: IdLike,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup[]> {
  const { data } = await api.get<{ data?: PinPhotoGroup[]; message?: string }>(
    `/photo-groups/${encodeURIComponent(String(toKey(pinId)))}`,
    { withCredentials: true, ...(config ?? {}) }
  );
  return assertArray<PinPhotoGroup>(
    data?.data,
    data?.message || "사진 그룹 조회 실패"
  );
}

/* In-flight dedupe for create group */
type InflightKey = string;
type InflightEntry = Promise<PinPhotoGroup>;
const inflightCreateGroup = new Map<InflightKey, InflightEntry>();
const keyOfCreateGroup = (pinId: IdLike, title: string, so?: number | null) =>
  `${String(pinId)}::${title}::${so ?? ""}`;

/** POST /photo-groups */
export async function createPhotoGroup(
  dto: CreatePinPhotoGroupDto,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup> {
  const pinId = toKey(dto.pinId);
  const fallbackTitle =
    typeof dto.sortOrder === "number"
      ? `카드 ${dto.sortOrder + 1}`
      : "사진그룹";
  const title = (dto.title ?? "").toString().trim() || fallbackTitle;

  const payload: { pinId: IdLike; title: string; sortOrder?: number } = {
    pinId,
    title,
    ...(dto.sortOrder === 0 || Number.isFinite(Number(dto.sortOrder))
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
  };

  const inflightKey = keyOfCreateGroup(pinId, title, dto.sortOrder ?? null);
  const existed = inflightCreateGroup.get(inflightKey);
  if (existed) return existed;

  const work = (async () => {
    try {
      const { data } = await api.post<{
        data?: PinPhotoGroup;
        message?: string;
      }>(`/photo-groups`, payload, {
        withCredentials: true,
        ...(config ?? {}),
      });
      if (!data?.data) throw new Error(data?.message || "사진 그룹 생성 실패");
      return data.data;
    } catch (e) {
      if (is409(e)) {
        const groups = await listPhotoGroupsByPin(pinId, config).catch(
          () => []
        );
        const match =
          (groups as PinPhotoGroup[]).find((g) => {
            const so = (g.sortOrder ?? null) as number | null;
            const want = (dto.sortOrder ?? null) as number | null;
            return String(g.title) === title && so === want;
          }) ||
          (groups as PinPhotoGroup[]).find((g) => String(g.title) === title);
        if (match) return match;
        throw new Error(
          "이미 존재하는 사진그룹으로 보이지만 목록에서 찾지 못했습니다."
        );
      }
      throw e;
    } finally {
      inflightCreateGroup.delete(inflightKey);
    }
  })();

  inflightCreateGroup.set(inflightKey, work);
  return work;
}

/** ✅ PATCH /pin/photo-groups/:groupId  (신규: 단건 그룹 수정) */
export async function patchPhotoGroupById(
  groupId: IdLike,
  dto: UpdatePinPhotoGroupDto,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup> {
  const payload: UpdatePinPhotoGroupDto = {
    ...(typeof dto.title === "string" ? { title: dto.title } : {}),
    ...(dto.sortOrder === null
      ? { sortOrder: null }
      : dto.sortOrder === 0 || Number.isFinite(Number(dto.sortOrder))
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
  };

  const { data } = await api.patch<{ data?: PinPhotoGroup; message?: string }>(
    `/photo-groups/${encodeURIComponent(String(toKey(groupId)))}`,
    payload,
    { withCredentials: true, ...(config ?? {}) }
  );
  if (!data?.data) throw new Error(data?.message || "사진 그룹 수정 실패");
  return data.data;
}

/** (기존) PATCH /photo-groups/:groupId — 필요 시 호환용 */
export async function updatePhotoGroup(
  groupId: IdLike,
  dto: UpdatePinPhotoGroupDto,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup> {
  const payload: UpdatePinPhotoGroupDto = {
    ...(typeof dto.title === "string" ? { title: dto.title } : {}),
    ...(dto.sortOrder === null
      ? { sortOrder: null }
      : dto.sortOrder === 0 || Number.isFinite(Number(dto.sortOrder))
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
  };

  const { data } = await api.patch<{ data?: PinPhotoGroup; message?: string }>(
    `/photo-groups/${encodeURIComponent(String(toKey(groupId)))}`,
    payload,
    { withCredentials: true, ...(config ?? {}) }
  );
  if (!data?.data) throw new Error(data?.message || "사진 그룹 수정 실패");
  return data.data;
}

/* =========================
 * /photos
 * ========================= */

/** GET /photos/:groupId */
export async function listGroupPhotos(
  groupId: IdLike,
  config?: AxiosRequestConfig
): Promise<PinPhoto[]> {
  const { data } = await api.get<{ data?: PinPhoto[]; message?: string }>(
    `/photos/${encodeURIComponent(String(toKey(groupId)))}`,
    { withCredentials: true, ...(config ?? {}) }
  );
  return assertArray<PinPhoto>(
    data?.data,
    data?.message || "사진 목록 조회 실패"
  );
}

/* In-flight dedupe for create photos in group */
type InflightPhotoKey = string;
type InflightPhotoEntry = Promise<PinPhoto[]>;
const inflightCreatePhotos = new Map<InflightPhotoKey, InflightPhotoEntry>();
const createKey = (groupId: IdLike, body: CreatePinPhotoDto): string => {
  const gid = String(groupId);
  const urlsSig = Array.isArray(body.urls) ? body.urls.join(",") : "";
  const soSig = Array.isArray(body.sortOrders) ? body.sortOrders.join(",") : "";
  const cover = body.isCover ? "1" : "0";
  return `${gid}::${urlsSig}::${soSig}::${cover}`;
};

/** POST /photos/:groupId */
export async function createPhotosInGroup(
  groupId: IdLike,
  body: CreatePinPhotoDto,
  config?: AxiosRequestConfig
): Promise<PinPhoto[]> {
  if (!body?.urls?.length)
    throw new Error("사진 등록 실패: urls가 비어 있습니다.");

  const key = createKey(groupId, body);
  const existed = inflightCreatePhotos.get(key);
  if (existed) return existed;

  const work = (async () => {
    const { data } = await api.post<{ data?: PinPhoto[]; message?: string }>(
      `/photos/${encodeURIComponent(String(toKey(groupId)))}`,
      body,
      { withCredentials: true, ...(config ?? {}) }
    );
    return assertArray<PinPhoto>(data?.data, data?.message || "사진 등록 실패");
  })();

  inflightCreatePhotos.set(key, work);
  try {
    return await work;
  } finally {
    inflightCreatePhotos.delete(key);
  }
}

/** (기존) PATCH /photos — 다건 수정(커버/정렬/이동) */
export async function updatePhotos(
  body: {
    photoIds: IdLike[];
    isCover?: boolean;
    sortOrder?: number;
    moveGroupId?: IdLike | null;
  },
  config?: AxiosRequestConfig
): Promise<PinPhoto[]> {
  const normalized = {
    ...body,
    moveGroupId:
      body.moveGroupId === null || body.moveGroupId === undefined
        ? body.moveGroupId ?? null
        : toKey(body.moveGroupId),
  };
  const { data } = await api.patch<{ data?: PinPhoto[]; message?: string }>(
    `/photos`,
    normalized,
    { withCredentials: true, ...(config ?? {}) }
  );
  return assertArray<PinPhoto>(data?.data, data?.message || "사진 수정 실패");
}

/** ✅ PATCH /photos/:id  (단건 사진 수정 — groupId 절대 전송 X) */
export async function patchPhotoById(
  photoId: IdLike,
  dto: Partial<{
    caption: string | null;
    sortOrder: number | null;
    isCover: boolean | null;
    name?: string | null;
  }>,
  config?: AxiosRequestConfig
): Promise<PinPhoto> {
  // 🔥 dto 안에서 필요한 필드만 선택해서 payload 구성
  const payload: any = {};

  if ("caption" in dto) payload.caption = dto.caption;
  if ("name" in dto) payload.name = dto.name;
  if ("isCover" in dto) payload.isCover = dto.isCover;
  if ("sortOrder" in dto) payload.sortOrder = dto.sortOrder;

  // groupId는 절대 추가하지 않음!

  const { data } = await api.patch<{ data?: PinPhoto; message?: string }>(
    `/photos/${encodeURIComponent(String(toKey(photoId)))}`, // 🔥 /pin 제거, 올바른 엔드포인트
    payload,
    { withCredentials: true, ...(config ?? {}) }
  );

  if (!data?.data) throw new Error(data?.message || "사진 수정 실패");
  return data.data;
}

/** DELETE /photos */
export async function deletePhotos(
  photoIds: IdLike[],
  config?: AxiosRequestConfig
): Promise<{ affected: number }> {
  const { data } = await api.delete<{
    data?: { affected: number };
    message?: string;
  }>(`/photos`, {
    data: { photoIds }, // axios delete 본문 전송은 data 키에 넣어야 함
    withCredentials: true,
    ...(config ?? {}),
  });
  const result = data?.data;
  if (!result || typeof result.affected !== "number") {
    throw new Error(data?.message || "사진 삭제 실패");
  }
  return result;
}

/* =========================
 * 벌크 헬퍼 (수정모달 저장용)
 * ========================= */

export async function batchPatchPhotoGroups(
  changes: Array<{ id: IdLike; dto: UpdatePinPhotoGroupDto }>
) {
  if (!changes?.length) return [];
  return Promise.all(
    changes.map(({ id, dto }) => patchPhotoGroupById(id, dto))
  );
}

export async function batchPatchPhotos(
  changes: Array<{
    id: IdLike;
    dto: Partial<{
      caption: string | null;
      groupId: IdLike | null;
      sortOrder: number | null;
      isCover: boolean | null;
      name?: string | null;
    }>;
  }>
) {
  if (!changes?.length) return [];
  return Promise.all(changes.map(({ id, dto }) => patchPhotoById(id, dto)));
}
