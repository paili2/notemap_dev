import { api } from "@/shared/api/api";
import type { AxiosError, AxiosRequestConfig } from "axios";

/** 백엔드 엔티티에 맞춘 타입 (bigint→string 가능성 고려) */
export type PinPhotoGroup = {
  id: string | number;
  pinId: string | number;
  title: string; // 항상 존재
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

/** 생성 DTO (백엔드에서 받는 필드들) */
export type CreatePinPhotoGroupDto = {
  pinId: number | string; // 필수
  title?: string; // 미전송 시 400 → 기본값 처리
  sortOrder?: number | null;
};

/** 수정 DTO */
export type UpdatePinPhotoGroupDto = {
  title?: string | null;
  sortOrder?: number | null;
};

const is409 = (e: unknown) => {
  const err = e as AxiosError<any>;
  return !!(err?.response && err.response.status === 409);
};

/** GET /photo-groups/:pinId */
export async function listPhotoGroupsByPin(
  pinId: number | string,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup[]> {
  const { data } = await api.get<{ data?: PinPhotoGroup[]; message?: string }>(
    `/photo-groups/${encodeURIComponent(String(pinId))}`,
    { withCredentials: true, ...(config ?? {}) }
  );
  if (!data || !Array.isArray(data.data)) {
    const msg = data?.message || "사진 그룹 조회 실패";
    throw new Error(msg);
  }
  return data.data;
}

/* ──────────────────────────────────────────────────────────
 * In-flight dedupe: 동일 (pinId,title,sortOrder) 생성 중복 방지
 * ────────────────────────────────────────────────────────── */
type InflightKey = string;
type InflightEntry = Promise<PinPhotoGroup>;
const inflight = new Map<InflightKey, InflightEntry>();

function keyOfCreate(dto: {
  pinId: number | string;
  title: string;
  sortOrder?: number | null;
}) {
  const so = dto.sortOrder ?? "";
  return `${String(dto.pinId)}::${dto.title}::${String(so)}`;
}

/** POST /photo-groups
 *  - 'title' 필수 → 기본값 생성해 항상 전송
 *  - 중복 클릭/이펙트로 같은 요청이 겹칠 때 dedupe
 *  - 서버 409(중복) 시: 목록 조회로 동일 항목 찾아 반환
 */
export async function createPhotoGroup(
  dto: CreatePinPhotoGroupDto,
  config?: AxiosRequestConfig
): Promise<PinPhotoGroup> {
  // pinId는 가능하면 number로 보냄
  const pinId = Number.isFinite(Number(dto.pinId))
    ? Number(dto.pinId)
    : dto.pinId;

  // 백엔드 MinLength(1) 요구 → 기본값 생성
  const fallbackTitle =
    typeof dto.sortOrder === "number"
      ? `카드 ${dto.sortOrder + 1}`
      : "사진그룹";
  const title = (dto.title ?? "").toString().trim() || fallbackTitle;

  const payload: Required<Pick<CreatePinPhotoGroupDto, "pinId" | "title">> & {
    sortOrder?: number | null;
  } = {
    pinId,
    title,
    ...(dto.sortOrder === 0 || Number.isFinite(Number(dto.sortOrder))
      ? { sortOrder: Number(dto.sortOrder) }
      : {}),
  };

  const inflightKey = keyOfCreate(payload);
  const existed = inflight.get(inflightKey);
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
      if (!data?.data) {
        const msg = data?.message || "사진 그룹 생성 실패";
        throw new Error(msg);
      }
      return data.data;
    } catch (e) {
      // 서버 중복(409) → 동일 title/sortOrder 매칭 반환 시도
      if (is409(e)) {
        const groups = await listPhotoGroupsByPin(pinId, config).catch(
          () => []
        );
        const match =
          (groups as PinPhotoGroup[]).find((g) => {
            const so = (g.sortOrder ?? null) as number | null;
            const want = (payload.sortOrder ?? null) as number | null;
            return String(g.title) === title && so === want;
          }) ||
          // sortOrder 없이 생성한 경우 title만으로 fallback
          (groups as PinPhotoGroup[]).find((g) => String(g.title) === title);
        if (match) return match;
      }
      throw e;
    } finally {
      inflight.delete(inflightKey);
    }
  })();

  inflight.set(inflightKey, work);
  return work;
}

/** PATCH /photo-groups/:groupId */
export async function updatePhotoGroup(
  groupId: string | number,
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
    `/photo-groups/${encodeURIComponent(String(groupId))}`,
    payload,
    { withCredentials: true, ...(config ?? {}) }
  );
  if (!data?.data) {
    const msg = data?.message || "사진 그룹 수정 실패";
    throw new Error(msg);
  }
  return data.data;
}
