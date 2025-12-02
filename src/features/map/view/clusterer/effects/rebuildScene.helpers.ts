import type { MapMarker } from "@/features/map/shared/types/map";
import { DRAFT_ID } from "../styles";

/** markers 내용 변화에 반응하도록 안정적인 키 생성 */
export function buildSceneKey(markers: readonly MapMarker[] | undefined) {
  try {
    const core = [...(markers ?? [])]
      .map((m: any) => ({
        id: String(m.id),
        lat: m.position?.lat,
        lng: m.position?.lng,
        name:
          (
            m?.name ??
            m?.point?.name ??
            m?.data?.name ??
            m?.property?.name ??
            m?.property?.title ??
            m?.title ??
            ""
          )?.toString() ?? "",
        source: m?.source ?? "",
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return JSON.stringify(core);
  } catch {
    return `len:${markers?.length ?? 0}`;
  }
}

// 첫 번째 “실제 값” 선택
export function firstNonEmpty(...vals: Array<unknown>) {
  for (const v of vals) {
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) return t;
    } else if (typeof v === "number") {
      return String(v);
    }
  }
  return undefined;
}

/** "__something" 같은 내부 키는 라벨 후보에서 제거 */
export function cleanLabelCandidate(v: unknown) {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t) return undefined;
  if (t.startsWith("__")) return undefined;
  return t;
}

/**
 * 좌표 → 그룹핑용 키 (소수 5자리 ≈ 1.1m)
 * ⚠️ 주의: 이 값은 라벨/그룹핑 전용입니다.
 * ⚠️ 절대 payload 좌표로 역파싱(split(',').map(Number))하여 사용하지 마세요.
 *    실제 전송 좌표는 항상 m.position.lat/lng 또는 getPosition()에서 직접 추출하세요.
 */
export function toGroupingPosKey(lat?: number, lng?: number) {
  if (typeof lat === "number" && typeof lng === "number") {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
  }
  return undefined;
}

/* ───────── 마커 전처리용 타입 ───────── */
export type EnrichedMarker = {
  m: any;
  key: string;
  order?: number;
  isDraft: boolean;
  isPlan: boolean;
  isAddressOnly: boolean;
  posKey?: string;
};

type ReservationOrderMap = Record<string, number | undefined> | undefined;
type ReservationOrderByPosKey = Record<string, number | undefined> | undefined;

/** 주소 임시핀 여부 판정 */
function isAddressOnlyMarker(m: any, key: string) {
  return (
    m.source === "geocode" ||
    m.source === "search" ||
    key.startsWith("__temp__") ||
    key.startsWith("__addr__") ||
    key === DRAFT_ID
  );
}

/** 순번 매칭 유틸: id 우선, **주소 임시핀은 posKey 매칭 금지** */
function resolveOrderIndex(
  m: any,
  key: string,
  reservationOrderMap: ReservationOrderMap,
  reservationOrderByPosKey: ReservationOrderByPosKey
): number | undefined {
  const byId = reservationOrderMap?.[String(m.pinDraftId ?? m.id)];
  if (typeof byId === "number") return byId;

  const isAddressOnly = isAddressOnlyMarker(m, key);
  if (isAddressOnly) return undefined;

  const lat =
    typeof m.position?.lat === "number"
      ? m.position.lat
      : m.getPosition?.().getLat?.();
  const lng =
    typeof m.position?.lng === "number"
      ? m.position.lng
      : m.getPosition?.().getLng?.();
  const posKey = m.posKey ?? toGroupingPosKey(lat, lng);

  if (posKey && reservationOrderByPosKey) {
    const byPos = reservationOrderByPosKey[posKey];
    if (typeof byPos === "number") return byPos;
  }
  return undefined;
}

/** RebuildScene에서 사용하는 전처리 결과 한 번에 계산 */
export function enrichMarkers(
  markers: readonly MapMarker[] | undefined,
  reservationOrderMap: ReservationOrderMap,
  reservationOrderByPosKey: ReservationOrderByPosKey
): EnrichedMarker[] {
  if (!markers) return [];

  return (markers as any[]).map((m) => {
    const key = String(m.id);
    const order = resolveOrderIndex(
      m,
      key,
      reservationOrderMap,
      reservationOrderByPosKey
    ); // 0 포함 number | undefined
    const isDraft = m.source === "draft";

    const isAddressOnly = isAddressOnlyMarker(m, key);

    const lat =
      typeof m.position?.lat === "number"
        ? m.position.lat
        : m.getPosition?.().getLat?.();
    const lng =
      typeof m.position?.lng === "number"
        ? m.position.lng
        : m.getPosition?.().getLng?.();
    const posKey = m.posKey ?? toGroupingPosKey(lat, lng);

    const idStr = String(m.id ?? "");
    const isVisitPlaceholder =
      (typeof (m as any).title === "string" &&
        (m as any).title.trim().startsWith("__visit__")) ||
      idStr.startsWith("__visit__");

    const isPlan =
      !isAddressOnly &&
      (isDraft ||
        isVisitPlaceholder ||
        m.isPlan === true ||
        m.visit?.state === "PLANNED" ||
        (typeof m.planCount === "number" && m.planCount > 0) ||
        typeof order === "number");

    return { m, key, order, isDraft, isPlan, isAddressOnly, posKey };
  });
}
