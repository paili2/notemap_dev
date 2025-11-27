import { BuildingType } from "@/features/properties/types/property-domain";
import { PinDetail } from "../pin";

export type PinSearchParams = {
  rooms?: number[];
  hasLoft?: boolean;
  hasTerrace?: boolean;
  hasElevator?: boolean;
  salePriceMin?: number;
  salePriceMax?: number;
  areaMinM2?: number;
  areaMaxM2?: number;

  /** ✅ 등기 유형 (여러 개 선택 가능) */
  buildingTypes?: BuildingType[];

  /** ✅ 최저 실입주금(원 단위) */
  minRealMoveInCostMax?: number;
};

/** 필터 없이 요청할 때만 함께 반환되는 draft */
export type PinDraftLite = {
  id: string;
  lat: number;
  lng: number;
  addressLine: string;
  draftState: "BEFORE" | "SCHEDULED";

  title?: string | null; // 매물명/메모 등
  name?: string | null; // 혹시 name으로 오는 경우 대비
  badge?: string | null; // LOFT, TERRACE 같은 배지
};

export type PinSearchResult = {
  pins: PinDetail[];
  drafts?: PinDraftLite[];
};

/**
 * 공통 쿼리스트링 빌더
 * - undefined / null → 전송 안함
 * - 배열 → key=a&key=b...
 * - boolean → "true" / "false"
 * - 숫자/문자 → String(value)
 */
export function buildSearchQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // null / undefined 는 무시
    if (value === undefined || value === null) return;

    // 배열: 빈 배열이면 무시, 값 있는 것만 append
    if (Array.isArray(value)) {
      if (value.length === 0) return;

      value.forEach((v) => {
        if (v === undefined || v === null || v === "") return;
        // 🔽 배열은 key[] 형태로 전송
        sp.append(`${key}[]`, String(v));
      });
      return;
    }

    // boolean: true/false 문자열로
    if (typeof value === "boolean") {
      sp.append(key, value ? "true" : "false");
      return;
    }

    // 빈 문자열은 무시
    if (value === "") return;

    // 나머지(number, string 등)
    sp.append(key, String(value));
  });

  return sp.toString();
}
