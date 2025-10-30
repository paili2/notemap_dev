"use client";

import { useMemo } from "react";
import { filled, hasPair } from "../../../lib/validators";
import { AspectRowLite } from "../../../types/property-domain";

/* 느슨한 면적 타입 */
type LooseAreaUnit = {
  exclusiveM2?: number | string | null;
  realM2?: number | string | null;
};
type LooseAreaSet = {
  title?: string;
  exMinM2?: string;
  exMaxM2?: string;
  exMinPy?: string;
  exMaxPy?: string;
  realMinM2?: string;
  realMaxM2?: string;
  realMinPy?: string;
  realMaxPy?: string;
  units?: LooseAreaUnit[];
};

type Args = {
  // 기본
  title: string;
  address: string;
  officePhone: string;
  /** UI에서 선택하는 주차유형 라벨(선택값 허용) */
  parkingType: string | null;
  completionDate: string;

  /** ⚠️ UI에서는 최저실입 입력 필드(문자열).
   *   DTO 전송 시엔 minRealMoveInCost(정수/null)로 매핑됨.
   *   저장 필수값 아님 → here: 필수 검사에서 제외
   */
  salePrice: string;

  // 숫자
  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;

  // 옵션
  options: string[];
  etcChecked: boolean;
  optionEtc: string;

  // 기타
  unitLinesLen: number;
  listingStars: number;
  aspects: AspectRowLite[];

  // 느슨한 타입 사용
  baseAreaSet: LooseAreaSet;
  extraAreaSets: LooseAreaSet[];
};

/** units 길이만 안전하게 얻는 헬퍼 */
function getUnitsLen(s: LooseAreaSet): number {
  const maybeUnits = s?.units;
  return Array.isArray(maybeUnits) ? maybeUnits.length : 0;
}

export function useCreateValidation({
  title,
  address,
  officePhone,
  parkingType, // 선택값 허용 → 필수 검사에서 제외
  completionDate,
  salePrice, // 최저실입 → 필수 검사에서 제외
  totalBuildings,
  totalFloors,
  totalHouseholds,
  remainingHouseholds,
  options,
  etcChecked,
  optionEtc,
  unitLinesLen,
  listingStars,
  aspects,
  baseAreaSet,
  extraAreaSets,
}: Args) {
  /* 면적 범위 유효성 */
  const baseHasExclusive = useMemo(
    () =>
      hasPair(baseAreaSet.exMinM2 ?? "", baseAreaSet.exMaxM2 ?? "") ||
      hasPair(baseAreaSet.exMinPy ?? "", baseAreaSet.exMaxPy ?? ""),
    [
      baseAreaSet.exMinM2,
      baseAreaSet.exMaxM2,
      baseAreaSet.exMinPy,
      baseAreaSet.exMaxPy,
    ]
  );

  const baseHasReal = useMemo(
    () =>
      hasPair(baseAreaSet.realMinM2 ?? "", baseAreaSet.realMaxM2 ?? "") ||
      hasPair(baseAreaSet.realMinPy ?? "", baseAreaSet.realMaxPy ?? ""),
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
        (s) =>
          hasPair(s.exMinM2 ?? "", s.exMaxM2 ?? "") ||
          hasPair(s.exMinPy ?? "", s.exMaxPy ?? "")
      ),
    [extraAreaSets]
  );

  const extrasHaveReal = useMemo(
    () =>
      extraAreaSets.some(
        (s) =>
          hasPair(s.realMinM2 ?? "", s.realMaxM2 ?? "") ||
          hasPair(s.realMinPy ?? "", s.realMaxPy ?? "")
      ),
    [extraAreaSets]
  );

  const hasExclusiveAny = baseHasExclusive || extrasHaveExclusive;
  const hasRealAny = baseHasReal || extrasHaveReal;

  /* 개별평수(units) 유효성 */
  const baseHasUnits = useMemo(
    () => getUnitsLen(baseAreaSet) > 0,
    [baseAreaSet]
  );
  const extrasHaveUnits = useMemo(
    () => extraAreaSets.some((s) => getUnitsLen(s) > 0),
    [extraAreaSets]
  );
  const hasUnitsAny = baseHasUnits || extrasHaveUnits;

  /* 옵션/기타 */
  const optionsValid = useMemo(
    () => options.length > 0 || (etcChecked && optionEtc.trim().length > 0),
    [options, etcChecked, optionEtc]
  );

  const aspectsValid = useMemo(
    () => aspects.length > 0 && aspects[0].dir.trim().length > 0,
    [aspects]
  );

  /* 최종 저장 가능 여부 */
  const isSaveEnabled = useMemo(() => {
    // 🔹 숫자 4종 모두 필수로 유지(기존 정책 유지)
    const numbersOk =
      filled(totalBuildings) &&
      filled(totalFloors) &&
      filled(totalHouseholds) &&
      filled(remainingHouseholds);

    // 🔹 주차유형(parkingType), 최저실입(salePrice)은 필수 아님
    const basicOk =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(completionDate) &&
      // 면적 한 종류 이상은 입력(전용/공급 범위 혹은 units)
      (hasExclusiveAny || hasRealAny || hasUnitsAny);

    return (
      basicOk &&
      numbersOk &&
      optionsValid &&
      unitLinesLen > 0 &&
      listingStars > 0 &&
      aspectsValid
    );
  }, [
    title,
    address,
    officePhone,
    completionDate,
    // 제외: parkingType, salePrice
    hasExclusiveAny,
    hasRealAny,
    hasUnitsAny,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,
    optionsValid,
    unitLinesLen,
    listingStars,
    aspectsValid,
  ]);

  return { isSaveEnabled };
}
