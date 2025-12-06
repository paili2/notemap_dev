import { DRAFT_PIN_ID } from "./panel.constants";
import type { LatLngLike, PropertyId } from "./panel.types";

/** 드래프트 id 판별 가드 */
export function isDraftId(id: unknown): id is typeof DRAFT_PIN_ID {
  return id === DRAFT_PIN_ID;
}

/** 빈 문자열/공백을 null로 정규화할 때 유용 */
export function normalizeNullableString(v?: string | null): string | null {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

/** 느슨한 불리언 변환 (true/"true"/1/"1") */
export function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

/** 서버 draftState → planned/reserved 매핑 */
export function mapDraftState(s?: string | null) {
  const v = String(s ?? "")
    .trim()
    .toUpperCase();
  const planned = v === "BEFORE" || v === "PENDING" || v === "PLANNED";
  const reserved = v === "SCHEDULED" || v === "RESERVED";
  return { planned, reserved };
}

/** __visit__/__reserved__/__plan__/__planned__ 형태에서 숫자 ID 추출 */
export function extractDraftIdFromPropertyId(
  propertyId?: PropertyId | number | null
): number | undefined {
  if (propertyId == null) return undefined;
  const raw = String(propertyId).trim();
  if (!raw) return undefined;

  const m = raw.match(
    /^(?:__visit__|__reserved__|__plan__|__planned__)(\d+)$/i
  );
  if (m && m[1]) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** kakao LatLng | POJO 모두 지원 */
export function getLatLngFromPosition(pos: LatLngLike) {
  if ("getLat" in pos && typeof pos.getLat === "function") {
    return {
      lat: pos.getLat(),
      lng: pos.getLng(),
    };
  }
  return {
    lat: (pos as any).lat as number,
    lng: (pos as any).lng as number,
  };
}

/** 빈값 / __draft__ / __new__ / 숫자가 아닌 id 는 모두 임시 드래프트 취급 */
export function isDraftLikeId(id?: PropertyId | null): boolean {
  const s = String(id ?? "")
    .trim()
    .toLowerCase();

  // 완전 비어 있으면 드래프트
  if (!s) return true;

  // 우리 쪽 임시 id 패턴들
  if (s === "__draft__" || s === "__new__") return true;

  // 정상 매물 id는 숫자 문자열이라는 가정
  if (!/^\d+$/.test(s)) return true;

  return false;
}
