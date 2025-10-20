import { api } from "@/shared/api/api";

/** 공통 응답 형태 */
type ApiWrap<T> = { message?: string; data?: T };

/** 예약 생성 DTO (백엔드 스펙) */
export type CreateSurveyReservationDto = {
  pinDraftId: number; // draftId -> pinDraftId
  reservedDate: string; // "YYYY-MM-DD"
  note?: string; // 선택
};

/** 내 예약 아이템 (정규화 후 UI 타입) */
export type MyReservation = {
  id: string; // 문자열 통일
  pinDraftId?: string | null;
  addressLine?: string | null;
  reservedDate?: string | null; // "YYYY-MM-DD"
  createdAt?: string | null;
  lat?: number | null;
  lng?: number | null;
  posKey?: string; // ✅ 좌표 매칭용 (소수점 5자리)
};

/** 예약 없는 활성 임시핀 */
export type BeforeDraft = {
  id: string; // 문자열 통일
  lat: number;
  lng: number;
  addressLine?: string | null;
  createdAt?: string | null;
};

/** 바운딩 파라미터 */
export type BoundsParams = {
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
};

/* ──────────────────────────────────────────────
 * 내부 유틸(정규화)
 * ────────────────────────────────────────────── */
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

const normalizeReservation = (raw: any): MyReservation => {
  const lat = toNum(raw?.lat);
  const lng = toNum(raw?.lng);
  return {
    id: String(raw?.id),
    pinDraftId: raw?.pinDraftId == null ? null : String(raw.pinDraftId),
    addressLine: toStrOrNull(raw?.addressLine),
    reservedDate: toStrOrNull(raw?.reservedDate),
    createdAt: toStrOrNull(raw?.createdAt),
    lat,
    lng,
    posKey: makePosKey(lat, lng), // ✅ 추가
  };
};

const normalizeBeforeDraft = (raw: any): BeforeDraft => ({
  id: String(raw?.id),
  lat: Number(raw?.lat ?? NaN),
  lng: Number(raw?.lng ?? NaN),
  addressLine: toStrOrNull(raw?.addressLine),
  createdAt: toStrOrNull(raw?.createdAt),
});

/* ──────────────────────────────────────────────
 * API
 * ────────────────────────────────────────────── */

/** ✅ 예약 생성 (세션 필요) */
export async function createSurveyReservation(
  dto: CreateSurveyReservationDto,
  signal?: AbortSignal
) {
  const res = await api.post<ApiWrap<{ id: number | string }>>(
    "survey-reservations",
    dto,
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );

  const payload = (res.data as any) ?? {};
  const inner = payload.data ?? payload;
  if (!inner || inner.id == null) {
    throw new Error("Invalid response: missing reservation id");
  }
  return { id: String(inner.id) };
}

/** ✅ 내 예약 목록 조회 (/survey-reservations/scheduled) */
export async function fetchMySurveyReservations(
  signal?: AbortSignal
): Promise<MyReservation[]> {
  const res = await api.get<ApiWrap<MyReservation[] | any[]>>(
    "survey-reservations/scheduled",
    { withCredentials: true, signal }
  );

  const payload = (res.data as any) ?? {};
  const list = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];
  if (!Array.isArray(list)) return [];

  return list.map(normalizeReservation);
}

/** ✅ 답사 전(예약 없는) 임시핀 목록 (/survey-reservations/before) — 바운딩 지원 */
export async function fetchUnreservedDrafts(
  bounds?: BoundsParams,
  signal?: AbortSignal
): Promise<BeforeDraft[]> {
  const res = await api.get<ApiWrap<BeforeDraft[] | any[]>>(
    "survey-reservations/before",
    { params: bounds, signal }
  );

  const payload = (res.data as any) ?? {};
  const list = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];
  if (!Array.isArray(list)) return [];

  const normalized = list.map(normalizeBeforeDraft);
  return normalized.filter(
    (d) => Number.isFinite(d.lat) && Number.isFinite(d.lng)
  );
}

/** ✅ 예약 취소 (세션 필요) */
export async function cancelSurveyReservation(
  id: number | string,
  signal?: AbortSignal
) {
  const res = await api.delete(`survey-reservations/${id}`, {
    withCredentials: true,
    signal,
  });

  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(`Cancel failed: ${res.status}`);
  }
}

/* ──────────────────────────────────────────────
 * 보너스: 숫자/문자 혼용 id 비교 유틸 (eqId)
 * ────────────────────────────────────────────── */
export const eqId = (
  a: string | number | null | undefined,
  b: string | number | null | undefined
) => a != null && b != null && String(a) === String(b);
