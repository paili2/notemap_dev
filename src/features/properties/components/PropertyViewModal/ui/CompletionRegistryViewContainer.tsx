"use client";

import { toYMDFlexible } from "@/lib/dateUtils";
import CompletionRegistryView from "../components/CompletionRegistryView/CompletionRegistryView";

/** 뷰모달의 준공/등기/최저실입 표시 컨테이너 */
type Props = {
  /** 문자열 또는 Date. 없으면 null/undefined */
  completionDate?: string | Date | null;
  registry?: any;
  slopeGrade?: any;
  structureGrade?: any;
  /** ✅ 최저 실입(정수 금액) */
  minRealMoveInCost?: number | null;
  /** ✅ 엘리베이터 O/X */
  elevator?: string | null;
};

export default function CompletionRegistryViewContainer({
  completionDate,
  registry,
  slopeGrade,
  structureGrade,
  minRealMoveInCost,
  elevator,
}: Props) {
  const completionText =
    completionDate != null && String(completionDate).trim() !== ""
      ? toYMDFlexible(completionDate, { utc: true })
      : "-";

  return (
    <CompletionRegistryView
      completionDate={completionText}
      registry={registry}
      slopeGrade={slopeGrade}
      structureGrade={structureGrade}
      minRealMoveInCost={minRealMoveInCost}
      elevator={elevator}
    />
  );
}
