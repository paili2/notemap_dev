"use client";

import { useCallback, useMemo } from "react";
import {
  POI_LABEL,
  PoiKind,
} from "@/features/map/components/overlays/poiOverlays";
import { cn } from "@/lib/cn";

const CANDIDATES: PoiKind[] = ["convenience", "cafe", "pharmacy", "subway"];

type Props = {
  value: PoiKind[];
  onChange: (next: PoiKind[]) => void;
  className?: string;
  disabled?: boolean;
};

export function PoiLayerToggle({
  value,
  onChange,
  className,
  disabled,
}: Props) {
  const setOf = useMemo(() => new Set(value), [value]);

  const toggle = useCallback(
    (k: PoiKind) => {
      if (disabled) return;
      const active = setOf.has(k);
      const next = active ? value.filter((v) => v !== k) : [...value, k];
      onChange(next);
    },
    [disabled, onChange, setOf, value]
  );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {CANDIDATES.map((k) => {
        const active = setOf.has(k);
        const label = POI_LABEL[k] ?? k;

        return (
          <button
            key={k}
            type="button"
            onClick={() => toggle(k)}
            disabled={disabled}
            role="switch"
            aria-checked={active}
            aria-label={`${label} 표시 토글`}
            title={label}
            className={cn(
              "px-3 py-1 rounded-full border text-sm transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              active
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            data-state={active ? "on" : "off"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
