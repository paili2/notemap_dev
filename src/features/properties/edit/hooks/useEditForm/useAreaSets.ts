"use client";

import { useCallback, useMemo, useState } from "react";
import { hasPair, setPack } from "@/features/properties/lib/validators";
import { AreaSet } from "../../types/editForm.types";

/** 면적 세트(base/extra) 관련 상태/파생값/헬퍼 전담 훅 */
export function useAreaSets() {
  const [areaSetsTouched, setAreaSetsTouched] = useState(false);

  const [baseAreaSet, _setBaseAreaSet] = useState<AreaSet>({
    title: "",
    exMinM2: "",
    exMaxM2: "",
    exMinPy: "",
    exMaxPy: "",
    realMinM2: "",
    realMaxM2: "",
    realMinPy: "",
    realMaxPy: "",
  });
  const [extraAreaSets, _setExtraAreaSets] = useState<AreaSet[]>([]);

  const setBaseAreaSet = useCallback(
    (v: AreaSet | ((prev: AreaSet) => AreaSet)) => {
      setAreaSetsTouched(true);
      _setBaseAreaSet(v as any);
    },
    []
  );

  const setExtraAreaSets = useCallback(
    (v: AreaSet[] | ((prev: AreaSet[]) => AreaSet[])) => {
      setAreaSetsTouched(true);
      _setExtraAreaSets(v as any);
    },
    []
  );

  /* ========== 파생값 ========== */
  const baseHasExclusive = useMemo(
    () =>
      hasPair(baseAreaSet.exMinM2, baseAreaSet.exMaxM2) ||
      hasPair(baseAreaSet.exMinPy, baseAreaSet.exMaxPy),
    [
      baseAreaSet.exMinM2,
      baseAreaSet.exMaxM2,
      baseAreaSet.exMinPy,
      baseAreaSet.exMaxPy,
    ]
  );
  const baseHasReal = useMemo(
    () =>
      hasPair(baseAreaSet.realMinM2, baseAreaSet.realMaxM2) ||
      hasPair(baseAreaSet.realMinPy, baseAreaSet.realMaxPy),
    [
      baseAreaSet.realMinM2,
      baseAreaSet.realMaxM2,
      baseAreaSet.realMinPy,
      baseAreaSet.realMaxPy,
    ]
  );
  const extrasHaveExclusive = useMemo(
    () =>
      extraAreaSets.some(
        (s) => hasPair(s.exMinM2, s.exMaxM2) || hasPair(s.exMinPy, s.exMaxPy)
      ),
    [extraAreaSets]
  );
  const extrasHaveReal = useMemo(
    () =>
      extraAreaSets.some(
        (s) =>
          hasPair(s.realMinM2, s.realMaxM2) || hasPair(s.realMinPy, s.realMaxPy)
      ),
    [extraAreaSets]
  );

  const hasExclusiveAny = baseHasExclusive || extrasHaveExclusive;
  const hasRealAny = baseHasReal || extrasHaveReal;

  /* ========== 저장용 pack 헬퍼 ========== */
  const packAreas = useCallback(() => {
    const exclusiveArea = setPack(
      baseAreaSet.exMinM2,
      baseAreaSet.exMaxM2,
      baseAreaSet.exMinPy,
      baseAreaSet.exMaxPy
    );
    const realArea = setPack(
      baseAreaSet.realMinM2,
      baseAreaSet.realMaxM2,
      baseAreaSet.realMinPy,
      baseAreaSet.realMaxPy
    );
    const extraExclusiveAreas = extraAreaSets.map((s) =>
      setPack(s.exMinM2, s.exMaxM2, s.exMinPy, s.exMaxPy)
    );
    const extraRealAreas = extraAreaSets.map((s) =>
      setPack(s.realMinM2, s.realMaxM2, s.realMinPy, s.realMaxPy)
    );
    const baseAreaTitleOut = baseAreaSet.title?.trim() ?? "";
    const extraAreaTitlesOut = extraAreaSets.map((s) => (s.title ?? "").trim());
    return {
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,
    };
  }, [baseAreaSet, extraAreaSets]);

  return {
    // 상태
    baseAreaSet,
    extraAreaSets,
    areaSetsTouched,

    // setter
    setBaseAreaSet,
    setExtraAreaSets,
    setAreaSetsTouched,

    // 파생값
    baseHasExclusive,
    baseHasReal,
    extrasHaveExclusive,
    extrasHaveReal,
    hasExclusiveAny,
    hasRealAny,

    // 헬퍼
    packAreas,
  } as const;
}
