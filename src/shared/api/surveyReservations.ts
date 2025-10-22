import { api } from "@/shared/api/api";

/** 공통 응답 형태 */
type ApiWrap<T> = { message?: string; data?: T };

/* ────────────────────────────────────────────
 * 타입들
 * ──────────────────────────────────────────── */

export type CreateSurveyReservationDto = {
  pinDraftId: number; // 임시핀 ID
  reservedDate: string; // "YYYY-MM-DD"
  note?: string; // 선택
  insertAt?: number; // 선택: 0 이상 정수(없으면 맨 뒤)
};

export type MyReservation = {
  id: string; // 문자열 통일
  pinDraftId?: string | null;
  addressLine?: string | null;
  reservedDate?: string | null; // "YYYY-MM-DD"
  createdAt?: string | null;
  lat?: number | null;
  lng?: number | null;
  posKey?: string; // 좌표 매칭용 (소수점 5자리)
  sortOrder?: number; // 0-based
  isActive?: boolean; // 서버가 주면 매핑
};

export type BeforeDraft = {
  id: string;
  lat: number;
  lng: number;
  addressLine?: string | null;
  createdAt?: string | null;
  isActive?: boolean;
};

export type BoundsParams = {
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
};

export type ReorderItem = {
  reservationId: number | string;
  sortOrder: number;
};

/* ────────────────────────────────────────────
 * 내부 유틸(정규화)
 * ──────────────────────────────────────────── */

const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toStrOrNull = (v: unknown): string | null =>
  v == null ? null : String(v);

const makePosKey = (
  lat?: number | null,
  lng?: number | null
): string | undefined =>
  lat != null && lng != null
    ? `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`
    : undefined;

/** 서버 snake/camel 혼재 대비 */
const getPinDraftId = (raw: any) =>
  raw?.pinDraftId != null
    ? raw.pinDraftId
    : raw?.pin_draft_id != null
    ? raw.pin_draft_id
    : undefined;

/** 정렬 우선순위: sortOrder ASC → reservedDate ASC → id ASC */
const sortByServerRule = <
  T extends { sortOrder?: number; reservedDate?: string | null; id: string }
>(
  arr: T[]
) =>
  [...arr].sort((a, b) => {
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;

    const ad = a.reservedDate ?? "";
    const bd = b.reservedDate ?? "";
    if (ad !== bd) return ad < bd ? -1 : 1;

    return a.id.localeCompare(b.id);
  });

const normalizeReservation = (raw: any): MyReservation => {
  const lat = toNum(raw?.lat);
  const lng = toNum(raw?.lng);
  const pinDraftId = getPinDraftId(raw);
  return {
    id: String(raw?.id),
    pinDraftId: pinDraftId == null ? null : String(pinDraftId),
    addressLine:
      toStrOrNull(raw?.addressLine) ??
      toStrOrNull(raw?.road_address) ??
      toStrOrNull(raw?.jibun_address),
    reservedDate: toStrOrNull(raw?.reservedDate) ?? toStrOrNull(raw?.date),
    createdAt:
      toStrOrNull(raw?.createdAt) ?? toStrOrNull(raw?.created_at) ?? null,
    lat,
    lng,
    posKey: makePosKey(lat, lng),
    sortOrder: typeof raw?.sortOrder === "number" ? raw.sortOrder : undefined,
    isActive: typeof raw?.isActive === "boolean" ? raw.isActive : undefined,
  };
};

const normalizeBeforeDraft = (raw: any): BeforeDraft => ({
  id: String(raw?.id),
  lat: Number(raw?.lat ?? NaN),
  lng: Number(raw?.lng ?? NaN),
  addressLine:
    toStrOrNull(raw?.addressLine) ??
    toStrOrNull(raw?.road_address) ??
    toStrOrNull(raw?.jibun_address),
  createdAt:
    toStrOrNull(raw?.createdAt) ?? toStrOrNull(raw?.created_at) ?? null,
  isActive: typeof raw?.isActive === "boolean" ? raw.isActive : undefined, // 👈 추가
});

/** Idempotency-Key 생성 */
const makeIdempotencyKey = () => {
  try {
    if ((globalThis as any)?.crypto?.randomUUID) {
      return (globalThis as any).crypto.randomUUID();
    }
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/* ────────────────────────────────────────────
 * API
 * ──────────────────────────────────────────── */

/** 0) 예약 전 임시핀 목록 GET /survey-reservations/before
 * 서버 스펙: Query/body 없음, 세션 불필요
 */
export async function fetchUnreservedDrafts(
  _bounds?: BoundsParams,
  signal?: AbortSignal
): Promise<BeforeDraft[]> {
  const res = await api.get<ApiWrap<any[]>>("survey-reservations/before", {
    withCredentials: false,
    signal,
  });

  const payload = (res.data as any) ?? {};
  const list = Array.isArray(payload.data) ? payload.data : [];

  // ✅ map 결과를 BeforeDraft[]로 고정
  const drafts = list.map(normalizeBeforeDraft) as BeforeDraft[];

  // ✅ 콜백에 타입가드(or 명시 타입)로 any 추론 방지
  return drafts.filter(
    (d): d is BeforeDraft => Number.isFinite(d.lat) && Number.isFinite(d.lng)
  );
}

/** 1) 예약 생성 POST /survey-reservations (insertAt 지원) */
export async function createSurveyReservation(
  dto: CreateSurveyReservationDto,
  signal?: AbortSignal
): Promise<{ id: string; sortOrder?: number }> {
  const res = await api.post<
    ApiWrap<{ id: number | string; sortOrder?: number }>
  >("survey-reservations", dto, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": makeIdempotencyKey(),
    },
    signal,
  });

  const payload = (res.data as any) ?? {};
  const inner = payload.data ?? payload;
  if (!inner || inner.id == null) {
    throw new Error("Invalid response: missing reservation id");
  }
  return {
    id: String(inner.id),
    sortOrder:
      typeof inner.sortOrder === "number" ? inner.sortOrder : undefined,
  };
}

/** 2) 내 예약 목록(개인 순서 반영) GET /survey-reservations/scheduled */
export async function fetchMySurveyReservations(
  signal?: AbortSignal
): Promise<MyReservation[]> {
  const res = await api.get<ApiWrap<any[]>>("survey-reservations/scheduled", {
    withCredentials: true,
    signal,
  });

  const payload = (res.data as any) ?? {};
  const list = Array.isArray(payload.data) ? payload.data : [];
  const normalized = list.map(normalizeReservation);

  // 서버가 이미 정렬해 주더라도 안전하게 한 번 더 보정
  return sortByServerRule(normalized);
}

/** 3) 예약 순서 재정렬 PATCH /survey-reservations/reorder */
export async function reorderSurveyReservations(
  items: ReorderItem[],
  signal?: AbortSignal
): Promise<{ count: number }> {
  const res = await api.patch<ApiWrap<{ count: number }>>(
    "survey-reservations/reorder",
    { items },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );
  const payload = (res.data as any) ?? {};
  const inner = payload.data ?? payload;
  return { count: Number(inner?.count ?? 0) };
}

/** 4) 예약 취소 DELETE /survey-reservations/:id (순서 압축) */
export async function cancelSurveyReservation(
  id: number | string,
  signal?: AbortSignal
): Promise<{
  reservationId: string;
  pinDraftId?: string | null;
  alreadyCanceled?: boolean;
}> {
  const res = await api.delete<ApiWrap<any>>(`survey-reservations/${id}`, {
    withCredentials: true,
    signal,
  });

  const payload = (res.data as any) ?? {};
  const inner = payload.data ?? payload;

  return {
    reservationId: String(inner?.reservationId ?? id),
    pinDraftId:
      inner?.pin_draft_id != null ? String(inner.pin_draft_id) : undefined,
    alreadyCanceled:
      typeof inner?.alreadyCanceled === "boolean"
        ? inner.alreadyCanceled
        : undefined,
  };
}

/** 숫자/문자 혼용 id 비교 */
export const eqId = (
  a: string | number | null | undefined,
  b: string | number | null | undefined
) => a != null && b != null && String(a) === String(b);
