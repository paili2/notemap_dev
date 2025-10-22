"use client";

import { useMemo } from "react";
import { filled, hasPair } from "../../../lib/validators";
import { AreaSet } from "../../sections/AreaSetsSection/types";
import { AspectRowLite } from "../../../types/property-domain";

type Args = {
  // 기본
  title: string;
  address: string;
  officePhone: string;
  /** 초기엔 미선택(null)일 수 있음 */
  parkingType: string | null; // ⬅️ 변경
  completionDate: string;
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
  baseAreaSet: AreaSet;
  extraAreaSets: AreaSet[];
};

export function useCreateValidation({
  title,
  address,
  officePhone,
  parkingType,
  completionDate,
  salePrice,
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

  const optionsValid = useMemo(
    () => options.length > 0 || (etcChecked && optionEtc.trim().length > 0),
    [options, etcChecked, optionEtc]
  );

  const aspectsValid = useMemo(
    () => aspects.length > 0 && aspects[0].dir.trim().length > 0,
    [aspects]
  );

  const isSaveEnabled = useMemo(() => {
    const numbersOk =
      filled(totalBuildings) &&
      filled(totalFloors) &&
      filled(totalHouseholds) &&
      filled(remainingHouseholds);

    const basicOk =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(parkingType ?? "") && // ⬅️ null 방지
      filled(completionDate) &&
      filled(salePrice) &&
      hasExclusiveAny &&
      hasRealAny;

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
    parkingType,
    completionDate,
    salePrice,
    hasExclusiveAny,
    hasRealAny,
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
