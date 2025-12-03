import { api } from "@/shared/api/api";
import type { AxiosRequestConfig } from "axios";
import { assertArray, is409, toKey } from "./utils";
import type {
  IdLike,
  PinPhotoGroup,
  CreatePinPhotoGroupDto,
  UpdatePinPhotoGroupDto,
} from "@/shared/api/photos/types";

/** 👉 타입은 여전히 여기서 재노출 (기존 사용처 깨지지 않게) */
export type {
  IdLike,
  PinPhotoGroup,
  CreatePinPhotoGroupDto,
  UpdatePinPhotoGroupDto,
} from "@/shared/api/photos/types";

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

  const payload: {
    pinId: IdLike;
    title: string;
    sortOrder?: number;
    isDocument?: boolean;
  } = {
    pinId,
    title,
    ...(dto.sortOrder === 0 || Number.isFinite(Number(dto.sortOrder))
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
    ...(typeof dto.isDocument === "boolean"
      ? { isDocument: dto.isDocument }
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

/** ✅ PATCH /photo-groups/:groupId  (단건 그룹 수정) */
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
    // isDocument는 null/boolean 그대로 패스
    ...("isDocument" in dto ? { isDocument: dto.isDocument ?? null } : {}),
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
    ...("isDocument" in dto ? { isDocument: dto.isDocument ?? null } : {}),
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
