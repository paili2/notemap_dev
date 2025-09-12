"use client";

import { cn } from "@/lib/utils";

import type { FilterKey } from "../types";
import { FILTERS } from "../constants";

type Props = {
  active: FilterKey;
  onChange?: (k: FilterKey) => void;
  className?: string;
};

export default function FilterGroup({ active, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 shadow-sm ring-1 ring-black/5",
        className
      )}
      role="radiogroup"
      aria-label="매물 필터"
    >
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            role="radio"
            aria-checked={isActive}
            type="button"
            onClick={() => onChange?.(f.key)}
            className={cn(
              "rounded px-3 py-1 text-sm",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            )}
            data-filter-key={f.key}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
