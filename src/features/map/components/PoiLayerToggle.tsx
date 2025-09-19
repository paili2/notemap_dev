"use client";

import { useMemo } from "react";
import { POI_LABEL, PoiKind } from "../lib/poiCategory";

export function PoiLayerToggle({
  value,
  onChange,
}: {
  value: PoiKind[];
  onChange: (next: PoiKind[]) => void;
}) {
  const candidates: PoiKind[] = [
    "convenience",
    "cafe",
    "pharmacy",
    "subway",
    "busstop",
  ];
  const setOf = useMemo(() => new Set(value), [value]);

  return (
    <div className="flex flex-wrap gap-2">
      {candidates.map((k) => {
        const active = setOf.has(k);
        return (
          <button
            key={k}
            type="button"
            className={`px-3 py-1 rounded-full border text-sm ${
              active ? "bg-blue-600 text-white" : "bg-white"
            }`}
            onClick={() => {
              const next = active
                ? value.filter((v) => v !== k)
                : [...value, k];
              onChange(next);
            }}
            aria-pressed={active}
          >
            {POI_LABEL[k]}
          </button>
        );
      })}
    </div>
  );
}
