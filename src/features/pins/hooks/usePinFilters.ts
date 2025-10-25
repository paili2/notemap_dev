import { useMemo, useState, useCallback } from "react";
import type { PinSearchParams } from "../types/pin-search";

/** 모달(UI)에서 관리하는 상태 (면적은 '평' 단위) */
export type FilterUiState = {
  rooms: number[]; // 예: [1, 2, 3]
  hasLoft?: boolean; // true | false | undefined(미적용)
  hasTerrace?: boolean;
  hasElevator?: boolean;
  salePriceMin?: number; // 원화(정수)
  salePriceMax?: number;
  areaMin?: number; // 평
  areaMax?: number; // 평
};

const PYEONG_TO_M2 = 3.305785;

/* ───────────── 유틸 ───────────── */
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const hasVal = (v: unknown) => v !== undefined && v !== null;

/** 정수 배열(rooms) 정규화: 소수 버림, 음수 제거, 중복 제거, 오름차순 */
function normalizeRooms(src: number[]): number[] {
  const set = new Set<number>();
  src.forEach((n) => {
    if (isNum(n) && n >= 0) set.add(Math.floor(n));
  });
  return Array.from(set).sort((a, b) => a - b);
}

/** 숫자 범위 정규화: (min, max) 주어졌을 때 swap 및 동일값 허용 */
function normalizeRange(
  a?: number,
  b?: number
): { min?: number; max?: number } {
  const okA = isNum(a);
  const okB = isNum(b);
  if (!okA && !okB) return {};
  if (okA && !okB) return { min: a };
  if (!okA && okB) return { max: b };
  // 둘 다 유효
  const min = Math.min(a as number, b as number);
  const max = Math.max(a as number, b as number);
  return { min, max };
}

/** 평→㎡ 반올림 (0도 허용) */
function toM2(py?: number): number | undefined {
  if (!isNum(py)) return undefined;
  return Math.round(py * PYEONG_TO_M2);
}

/* ───────────── 변환: UI → 서버 파라미터 ───────────── */
function toParams(ui: FilterUiState): PinSearchParams {
  const p: PinSearchParams = {};

  // rooms
  const rooms = normalizeRooms(ui.rooms || []);
  if (rooms.length) p.rooms = rooms;

  // boolean 3상태는 undefined면 키 자체를 제외
  if (ui.hasLoft !== undefined) p.hasLoft = ui.hasLoft;
  if (ui.hasTerrace !== undefined) p.hasTerrace = ui.hasTerrace;
  if (ui.hasElevator !== undefined) p.hasElevator = ui.hasElevator;

  // 가격 범위 (0 허용)
  const price = normalizeRange(ui.salePriceMin, ui.salePriceMax);
  if (hasVal(price.min)) p.salePriceMin = price.min!;
  if (hasVal(price.max)) p.salePriceMax = price.max!;

  // 면적(평) → ㎡ 범위 (0 허용)
  const area = normalizeRange(ui.areaMin, ui.areaMax);
  if (hasVal(area.min)) p.areaMinM2 = toM2(area.min)!;
  if (hasVal(area.max)) p.areaMaxM2 = toM2(area.max)!;

  return p;
}

/* ───────────── 훅 본문 ───────────── */
export function usePinFilters(initial?: Partial<FilterUiState>) {
  const [ui, setUi] = useState<FilterUiState>({ rooms: [], ...initial });

  const params = useMemo(() => toParams(ui), [ui]);

  // 빈 필터 여부 (서버에 보낼 실제 파라미터 기준)
  const isEmpty = useMemo(() => Object.keys(params).length === 0, [params]);

  const reset = useCallback(() => setUi({ rooms: [] }), []);

  // 편의 토글러: rooms 항목 토글 (중복/정렬 자동 처리)
  const toggleRoom = useCallback((room: number) => {
    setUi((prev) => {
      const next = new Set(prev.rooms ?? []);
      if (next.has(room)) next.delete(room);
      else next.add(room);
      return { ...prev, rooms: normalizeRooms(Array.from(next)) };
    });
  }, []);

  // 편의 설정기: 가격(원)
  const setSalePrice = useCallback((min?: number, max?: number) => {
    setUi((prev) => {
      const r = normalizeRange(min, max);
      return {
        ...prev,
        salePriceMin: r.min,
        salePriceMax: r.max,
      };
    });
  }, []);

  // 편의 설정기: 면적(평)
  const setAreaPy = useCallback((minPy?: number, maxPy?: number) => {
    setUi((prev) => {
      const r = normalizeRange(minPy, maxPy);
      return {
        ...prev,
        areaMin: r.min,
        areaMax: r.max,
      };
    });
  }, []);

  return {
    ui,
    setUi,
    params,
    isEmpty,
    reset,
    // optional helpers
    toggleRoom,
    setSalePrice,
    setAreaPy,
  };
}
