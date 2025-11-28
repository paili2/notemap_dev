"use client";

import { toYMDFlexible } from "@/lib/dateUtils";
import CompletionRegistryView from "../sections/CompletionRegistryView/CompletionRegistryView";

/** 뷰모달의 준공/등기/최저실입 표시 컨테이너 */
type Props = {
  /** 문자열 또는 Date. 없으면 null/undefined */
  completionDate?: string | Date | null;
  registry?: any;
  slopeGrade?: any;
  structureGrade?: any;
  /** ✅ 최저 실입(정수 금액) */
  minRealMoveInCost?: number | null;
  /** ✅ 엘리베이터: boolean | "O" | "X" */
  elevator?: boolean | string | null;
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

  // 👇 여기서 boolean / string 을 "O" / "X" 로 정규화
  const elevatorLabel =
    elevator === "O" || elevator === "X"
      ? elevator
      : elevator === true
      ? "O"
      : elevator === false
      ? "X"
      : null;

  return (
    <CompletionRegistryView
      completionDate={completionText}
      registry={registry}
      slopeGrade={slopeGrade}
      structureGrade={structureGrade}
      minRealMoveInCost={minRealMoveInCost}
      elevator={elevatorLabel}
    />
  );
}
