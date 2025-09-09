"use client";

import { parsePackedRangeToM2 } from "@/features/properties/lib/area";
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
  // 🔁 base도 packed 가능성이 있으므로 새 파서 사용
  const exBase = parsePackedRangeToM2(exclusiveArea);
  const reBase = parsePackedRangeToM2(realArea);

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
        <Row label="전용" minM2={exBase.minM2} maxM2={exBase.maxM2} />
        <Row label="실평" minM2={reBase.minM2} maxM2={reBase.maxM2} />
      </div>

      {Array.from({ length: len }, (_, i) => {
        const exi = parsePackedRangeToM2(exArr[i] ?? "");
        const rei = parsePackedRangeToM2(reArr[i] ?? "");
        const title =
          Array.isArray(extraAreaTitles) &&
          (extraAreaTitles[i]?.trim()?.length ?? 0) > 0
            ? extraAreaTitles[i]!
            : `개별 평수입력 #${i + 2}`;

        return (
          <div key={i} className="rounded-xl border bg-muted/5 p-3 space-y-3">
            <div className="mb-1 text-sm font-medium">{title}</div>
            <Row label="전용" minM2={exi.minM2} maxM2={exi.maxM2} />
            <Row label="실평" minM2={rei.minM2} maxM2={rei.maxM2} />
          </div>
        );
      })}
    </div>
  );
}
