"use client";

import React from "react";
import StructureLinesList from "../sections/StructureLinesList";

type UnitView = {
  rooms: number;
  baths: number;
  hasLoft: boolean;
  hasTerrace: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
};

const toNum = (v: any): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const toBool = (v: any) =>
  v === true || v === "true" || v === 1 || v === "1" || v === "Y" || v === "y";

/** 구버전 lines → 신버전 units 변환 */
function convertLinesToUnits(lines?: any[] | null): UnitView[] {
  if (!Array.isArray(lines)) return [];
  return lines.map((l) => ({
    rooms: toNum(l?.rooms) ?? 0,
    baths: toNum(l?.baths) ?? 0,
    hasLoft: toBool(l?.duplex),
    hasTerrace: toBool(l?.terrace),
    // 가격값이 없으면 primary/secondary를 숫자로 파싱해서 사용
    minPrice: toNum(l?.minPrice) ?? toNum(l?.primary),
    maxPrice: toNum(l?.maxPrice) ?? toNum(l?.secondary),
  }));
}

export default function StructureLinesListContainer({
  lines = [],
  units = [],
}: {
  lines?: any[];
  units?: UnitView[];
}) {
  // 🔍 디버그
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug(
      "[StructureLinesListContainer] units.len:",
      units?.length ?? 0,
      {
        sample: units?.[0],
        linesLen: Array.isArray(lines) ? lines.length : 0,
      }
    );
  }

  // units 우선, 없으면 lines를 변환해서라도 4열로 표시
  const effUnits: UnitView[] =
    Array.isArray(units) && units.length > 0
      ? units
      : convertLinesToUnits(lines);

  // 둘 다 없으면 예전 리스트(하이픈 표시)로 폴백
  if (effUnits.length === 0) {
    return <StructureLinesList lines={[]} />;
  }

  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-medium">구조별 입력</h3>

      <div className="space-y-2">
        {effUnits.map((u, idx) => {
          const features =
            [u.hasLoft ? "복층" : null, u.hasTerrace ? "테라스" : null]
              .filter(Boolean)
              .join(", ") || "-";

          const minText =
            typeof u.minPrice === "number" && Number.isFinite(u.minPrice)
              ? String(u.minPrice)
              : "-";
          const maxText =
            typeof u.maxPrice === "number" && Number.isFinite(u.maxPrice)
              ? String(u.maxPrice)
              : "-";

          return (
            <div
              key={idx}
              className="min-w-0 rounded-md border bg-white px-2 py-2"
            >
              <div className="flex items-center min-w-0">
                {/* 방/욕실 */}
                <div className="flex-1 min-w-0 text-center text-sm">
                  {u.rooms ?? 0}/{u.baths ?? 0}
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* 특징 */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {features}
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* 최소 */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {minText}
                </div>

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
    </section>
  );
}
