"use client";

import type { UnitLine } from "@/features/properties/types/property-domain";

type Props = { lines?: UnitLine[] };

/** any → number | undefined (문자열 숫자/쉼표 허용) */
const toNum = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

/** any → 정수 문자열 | "-" */
const toNumText = (v: unknown): string => {
  const n = toNum(v);
  return typeof n === "number" ? String(Math.trunc(n)) : "-";
};

/** any → 정수 (fallback 사용) */
const toInt = (v: unknown, fallback = 0) => {
  const n = toNum(v);
  return typeof n === "number" ? Math.trunc(n) : fallback;
};

/** any → boolean (Y/1/true 허용) */
const toBool = (v: unknown) =>
  v === true || v === "true" || v === 1 || v === "1" || v === "Y" || v === "y";

export default function StructureLinesList({ lines = [] }: Props) {
  const hasLines = Array.isArray(lines) && lines.length > 0;

  if (!hasLines) {
    return (
      <div className="text-sm">
        <span className="font-medium">구조별 입력</span>
        <div className="mt-1 text-muted-foreground">-</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">구조별 입력</div>

      <div className="space-y-2">
        {lines.map((l, idx) => {
          const rooms = toInt((l as any)?.rooms);
          const baths = toInt((l as any)?.baths);
          const rb = `${rooms}/${baths}`;

          // 복층/테라스는 boolean 혹은 "Y"/"1"/"true"도 허용
          const duplex = toBool((l as any)?.duplex);
          const terrace = toBool((l as any)?.terrace);

          const features =
            [duplex ? "복층" : null, terrace ? "테라스" : null]
              .filter(Boolean)
              .join(", ") || "-";

          // 최소/최대는 숫자만 추려서 노출 (문자면 숫자 부분만 파싱)
          const minText = toNumText(
            (l as any)?.primary ?? (l as any)?.minPrice
          );
          const maxText = toNumText(
            (l as any)?.secondary ?? (l as any)?.maxPrice
          );

          // 키: 서버 id가 있으면 우선 사용
          const key =
            (l as any)?.id ??
            `${idx}-${rooms}-${baths}-${duplex ? 1 : 0}-${terrace ? 1 : 0}`;

          return (
            <div
              key={key}
              className="min-w-0 rounded-md border bg-white px-2 py-2"
            >
              <div className="flex items-center min-w-0">
                {/* 방/욕실 */}
                <div className="flex-1 min-w-0 text-center text-sm">{rb}</div>

                {/* | */}
                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* 특징 */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {features}
                </div>

                {/* | */}
                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* 최소 */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {minText}
                </div>

                {/* | */}
                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* 최대 */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {maxText}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
