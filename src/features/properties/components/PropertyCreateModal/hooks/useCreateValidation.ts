"use client";

import { useMemo } from "react";
import { filled, hasPair } from "../../../lib/validators";
import { AspectRowLite } from "../../../types/property-domain";

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
  title: string;
  address: string;
  officePhone: string;
  parkingType: string | null;
  completionDate: string;
  salePrice: string;

  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;

  options: string[];
  etcChecked: boolean;
  optionEtc: string;

  unitLinesLen: number;
  /** ⭐ listingStars 제거 → parkingGrade 사용 */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  aspects: AspectRowLite[];

  baseAreaSet: LooseAreaSet;
  extraAreaSets: LooseAreaSet[];
};

function getUnitsLen(s: LooseAreaSet): number {
  return Array.isArray(s?.units) ? s.units.length : 0;
}

export function useCreateValidation(a: Args) {
  const baseHasExclusive = useMemo(
    () =>
      hasPair(a.baseAreaSet.exMinM2 ?? "", a.baseAreaSet.exMaxM2 ?? "") ||
      hasPair(a.baseAreaSet.exMinPy ?? "", a.baseAreaSet.exMaxPy ?? ""),
    [
      a.baseAreaSet.exMinM2,
      a.baseAreaSet.exMaxM2,
      a.baseAreaSet.exMinPy,
      a.baseAreaSet.exMaxPy,
    ]
  );

  const baseHasReal = useMemo(
    () =>
      hasPair(a.baseAreaSet.realMinM2 ?? "", a.baseAreaSet.realMaxM2 ?? "") ||
      hasPair(a.baseAreaSet.realMinPy ?? "", a.baseAreaSet.realMaxPy ?? ""),
    [
      a.baseAreaSet.realMinM2,
      a.baseAreaSet.realMaxM2,
      a.baseAreaSet.realMinPy,
      a.baseAreaSet.realMaxPy,
    ]
  );

  const extrasHaveExclusive = useMemo(
    () =>
      a.extraAreaSets.some(
        (s) =>
          hasPair(s.exMinM2 ?? "", s.exMaxM2 ?? "") ||
          hasPair(s.exMinPy ?? "", s.exMaxPy ?? "")
      ),
    [a.extraAreaSets]
  );

  const extrasHaveReal = useMemo(
    () =>
      a.extraAreaSets.some(
        (s) =>
          hasPair(s.realMinM2 ?? "", s.realMaxM2 ?? "") ||
          hasPair(s.realMinPy ?? "", s.realMaxPy ?? "")
      ),
    [a.extraAreaSets]
  );

  const hasExclusiveAny = baseHasExclusive || extrasHaveExclusive;
  const hasRealAny = baseHasReal || extrasHaveReal;

  const baseHasUnits = useMemo(
    () => getUnitsLen(a.baseAreaSet) > 0,
    [a.baseAreaSet]
  );
  const extrasHaveUnits = useMemo(
    () => a.extraAreaSets.some((s) => getUnitsLen(s) > 0),
    [a.extraAreaSets]
  );
  const hasUnitsAny = baseHasUnits || extrasHaveUnits;

  const optionsValid = useMemo(
    () =>
      a.options.length > 0 || (a.etcChecked && a.optionEtc.trim().length > 0),
    [a.options, a.etcChecked, a.optionEtc]
  );

  const aspectsValid = useMemo(
    () => a.aspects.length > 0 && a.aspects[0].dir.trim().length > 0,
    [a.aspects]
  );

  const gradeNum = a.parkingGrade ? Number(a.parkingGrade) : 0;

  const isSaveEnabled = useMemo(() => {
    const numbersOk =
      filled(a.totalBuildings) &&
      filled(a.totalFloors) &&
      filled(a.totalHouseholds) &&
      filled(a.remainingHouseholds);

    const basicOk =
      filled(a.title) &&
      filled(a.address) &&
      filled(a.officePhone) &&
      filled(a.completionDate) &&
      (hasExclusiveAny || hasRealAny || hasUnitsAny);

    // ⭐ 별점 필수 정책 유지하려면 gradeNum > 0 체크 유지
    return (
      basicOk &&
      numbersOk &&
      optionsValid &&
      a.unitLinesLen > 0 &&
      gradeNum > 0 &&
      aspectsValid
    );
  }, [
    a.title,
    a.address,
    a.officePhone,
    a.completionDate,
    hasExclusiveAny,
    hasRealAny,
    hasUnitsAny,
    a.totalBuildings,
    a.totalFloors,
    a.totalHouseholds,
    a.remainingHouseholds,
    optionsValid,
    a.unitLinesLen,
    gradeNum,
    aspectsValid,
  ]);

  return { isSaveEnabled };
}
