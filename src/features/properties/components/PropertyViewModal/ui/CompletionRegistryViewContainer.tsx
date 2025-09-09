"use client";

import { toYMDFlexible } from "@/lib/dateUtils";
import CompletionRegistryView from "../components/CompletionRegistryView/CompletionRegistryView";

export default function CompletionRegistryViewContainer({
  completionDate,
  salePrice,
  registry,
  slopeGrade,
  structureGrade,
}: {
  completionDate?: string | Date | null; // 문자열로 온다고 했으니 number 제거
  salePrice?: string | number | null;
  registry?: any;
  slopeGrade?: any;
  structureGrade?: any;
}) {
  return (
    <CompletionRegistryView
      completionDate={toYMDFlexible(completionDate, { utc: true })}
      salePrice={salePrice}
      registry={registry}
      slopeGrade={slopeGrade}
      structureGrade={structureGrade}
    />
  );
}
