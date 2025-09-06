"use client";

import { unpackRange } from "../../utils";
import Row from "./components/Row";

export default function AreaSetsView({
  exclusiveArea,
  realArea,
  extraExclusiveAreas,
  extraRealAreas,
  baseAreaTitle,
  extraAreaTitles,
}: {
  exclusiveArea?: string | null;
  realArea?: string | null;
  extraExclusiveAreas?: string[] | null;
  extraRealAreas?: string[] | null;
  baseAreaTitle?: string;
  extraAreaTitles?: string[];
}) {
  const ex = unpackRange(exclusiveArea ?? "");
  const re = unpackRange(realArea ?? "");
  const exArr = Array.isArray(extraExclusiveAreas) ? extraExclusiveAreas : [];
  const reArr = Array.isArray(extraRealAreas) ? extraRealAreas : [];
  const len = Math.max(exArr.length, reArr.length);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/10 p-3 space-y-3">
        <div className="mb-1 text-sm font-medium">
          {baseAreaTitle && baseAreaTitle.trim().length > 0
            ? baseAreaTitle
            : "개별 평수입력"}
        </div>
        <Row label="전용" minM2={ex.min} maxM2={ex.max} />
        <Row label="실평" minM2={re.min} maxM2={re.max} />
      </div>

      {Array.from({ length: len }, (_, i) => {
        const exi = unpackRange(exArr[i] ?? "");
        const rei = unpackRange(reArr[i] ?? "");
        return (
          <div key={i} className="rounded-xl border bg-muted/5 p-3 space-y-3">
            <div className="mb-1 text-sm font-medium">
              {Array.isArray(extraAreaTitles) &&
              (extraAreaTitles[i]?.trim()?.length ?? 0) > 0
                ? extraAreaTitles![i]!
                : `개별 평수입력 #${i + 2}`}
            </div>
            <Row label="전용" minM2={exi.min} maxM2={exi.max} />
            <Row label="실평" minM2={rei.min} maxM2={rei.max} />
          </div>
        );
      })}
    </div>
  );
}
