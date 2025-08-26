"use client";

import type { UnitLine } from "@/features/properties/types/property-domain";

type Props = { lines?: UnitLine[] };

export default function StructureLinesList({ lines }: Props) {
  if (!lines || lines.length === 0) {
    return <div className="text-xs text-muted-foreground">3/2 복층 테라스</div>;
  }
  return (
    <div className="space-y-1">
      {lines.map((l, idx) => (
        <div
          key={idx}
          className="rounded border px-2 py-1 text-xs flex flex-wrap items-center gap-2"
        >
          <span>
            {l.rooms}/{l.baths}
          </span>
          <span className="opacity-60">|</span>
          <span>복층 {l.duplex ? "O" : "X"}</span>
          <span className="opacity-60">|</span>
          <span>테라스 {l.terrace ? "O" : "X"}</span>
          {(l.primary || l.secondary) && (
            <>
              <span className="opacity-60">|</span>
              <span>
                {l.primary || "-"} / {l.secondary || "-"}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
