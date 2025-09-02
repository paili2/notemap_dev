"use client";

import type { UnitLine } from "@/features/properties/types/property-domain";

export default function StructureLinesList({ lines }: { lines: UnitLine[] }) {
  if (!lines?.length)
    return (
      <div className="text-sm">
        <span className="font-medium">구조별 입력</span>
        <div className="mt-1 text-muted-foreground">-</div>
      </div>
    );

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">구조별 입력</div>

      <div className="space-y-2">
        {lines.map((l, idx) => {
          const rb = `${l.rooms ?? 0}/${l.baths ?? 0}`;
          const features =
            [l.duplex ? "복층" : null, l.terrace ? "테라스" : null]
              .filter(Boolean)
              .join(", ") || "-";
          const primary = l.primary?.trim() || "-";
          const secondary = l.secondary?.trim() || "-";

          return (
            <div
              key={idx}
              className="min-w-0 rounded-md border bg-white px-2 py-2"
            >
              <div className="flex items-center min-w-0">
                {/* 1/1 */}
                <div className="flex-1 min-w-0 text-center text-sm">{rb}</div>

                {/* | */}
                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* 복층, 테라스 */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {features}
                </div>

                {/* | */}
                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* primary */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {primary}
                </div>

                {/* | */}
                <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

                {/* secondary */}
                <div className="flex-1 min-w-0 text-center text-sm truncate">
                  {secondary}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
