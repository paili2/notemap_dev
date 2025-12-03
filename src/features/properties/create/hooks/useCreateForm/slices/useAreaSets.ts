"use client";

import { useMemo, useState } from "react";
import type { AreaSet as StrictAreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";

/** 개별평수 입력 시 사용하는 구조 */
export type AreaUnit = {
  /** 전용면적 (m² 단위) */
  exclusiveM2?: number | string | null;
  /** 실면적 (m² 단위) — 필요 시 추가 가능 */
  realM2?: number | string | null;
};

/**
 * 폼에서 사용하는 AreaSet:
 * - 섹션에서 쓰는 StrictAreaSet(모든 필드 string) + units/sortOrder
 */
export type AreaSet = StrictAreaSet & {
  /** 🔹 개별평수 목록 */
  units?: AreaUnit[];
  /** 🔹 정렬순서 (API 전송용) */
  sortOrder?: number;
};

export function useAreaSets() {
  const [baseAreaSet, setBaseAreaSet] = useState<AreaSet>({
    title: "",
    exMinM2: "",
    exMaxM2: "",
    exMinPy: "",
    exMaxPy: "",
    realMinM2: "",
    realMaxM2: "",
    realMinPy: "",
    realMaxPy: "",
    units: [], // ✅ 기본값
    sortOrder: 1,
  });

  const [extraAreaSets, setExtraAreaSets] = useState<AreaSet[]>([]);

  const state = useMemo(
    () => ({ baseAreaSet, extraAreaSets }),
    [baseAreaSet, extraAreaSets]
  );

  const actions = useMemo(
    () => ({
      setBaseAreaSet,
      setExtraAreaSets,
      /** 추가 세트 하나 삽입 */
      addExtraAreaSet: () =>
        setExtraAreaSets((prev) => [
          ...prev,
          {
            title: "",
            exMinM2: "",
            exMaxM2: "",
            exMinPy: "",
            exMaxPy: "",
            realMinM2: "",
            realMaxM2: "",
            realMinPy: "",
            realMaxPy: "",
            units: [],
            sortOrder: prev.length + 2, // base = 1 → 2부터 시작
          },
        ]),
      /** 세트 제거 */
      removeExtraAreaSet: (idx: number) =>
        setExtraAreaSets((prev) => prev.filter((_, i) => i !== idx)),
      /** 특정 인덱스의 세트 업데이트 */
      updateExtraAreaSet: (idx: number, data: Partial<AreaSet>) =>
        setExtraAreaSets((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, ...data } : item))
        ),
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
