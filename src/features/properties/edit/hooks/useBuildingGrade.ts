"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveInitialBuildingGradeFrom } from "../lib/toPinPatch";
import type { BuildingGrade } from "@/features/properties/types/building-grade";

// 훅 안에서는 null 까지 취급
type GradeWithNull = BuildingGrade | null;

type UseBuildingGradeArgs = {
  bridgedInitial: any;
  form: any; // useEditForm 리턴값
};

export type UseBuildingGradeResult = {
  buildingGrade: GradeWithNull;
  buildingGradeTouched: boolean;
  initialBuildingGrade: GradeWithNull;
  hadAgeFlags: boolean;
  setBuildingGrade: (v: GradeWithNull) => void;
};

export function useBuildingGrade({
  bridgedInitial,
  form,
}: UseBuildingGradeArgs): UseBuildingGradeResult {
  /** 신축/구옥 초기값: ageType/건물연식 관련 필드에서 유도, 없으면 null */
  const initialBuildingGrade = useMemo<GradeWithNull>(() => {
    const src = bridgedInitial as any;
    const v = deriveInitialBuildingGradeFrom(src);
    if (v === "new" || v === "old") return v;
    return null;
  }, [bridgedInitial]);

  /** ✅ 초기 서버 응답에 연식 관련 플래그가 있었는지 추적 */
  const hadAgeFlags = useMemo(() => {
    const src = bridgedInitial as any;
    if (!src) return false;

    const hasNew = Object.prototype.hasOwnProperty.call(src, "isNew");
    const hasOld = Object.prototype.hasOwnProperty.call(src, "isOld");

    const ageStr = (src?.ageType ?? src?.buildingAgeType ?? "")
      .toString()
      .trim()
      .toUpperCase();
    const hasAgeType = ageStr === "NEW" || ageStr === "OLD";

    const gradeStr = (src?.buildingGrade ?? "").toString().trim().toLowerCase();
    const hasGrade = gradeStr === "new" || gradeStr === "old";

    return hasNew || hasOld || hasAgeType || hasGrade;
  }, [bridgedInitial]);

  const [buildingGrade, _setBuildingGrade] =
    useState<GradeWithNull>(initialBuildingGrade);
  const [buildingGradeTouched, setBuildingGradeTouched] = useState(false);

  /** 초기값/bridgedInitial 바뀔 때 form 내부 상태와 동기화 */
  useEffect(() => {
    _setBuildingGrade(initialBuildingGrade);
    setBuildingGradeTouched(false);
    form?.setBuildingGrade?.(initialBuildingGrade);
    // form 은 초기 동기화 용도라 deps 에 넣지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBuildingGrade]);

  /** UI에서 선택됐을 때 form과 동기화 */
  const setBuildingGrade = useCallback(
    (v: GradeWithNull) => {
      _setBuildingGrade(v);
      setBuildingGradeTouched(true);
      form?.setBuildingGrade?.(v);
    },
    [form]
  );

  return {
    buildingGrade,
    buildingGradeTouched,
    initialBuildingGrade,
    hadAgeFlags,
    setBuildingGrade,
  };
}
