"use client";

import { cn } from "@/lib/utils";
import { FILTERS } from "../constants";
import type { FilterKey } from "../types";

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
      role="group"
      aria-label="매물 필터"
    >
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange?.(f.key)}
            className={cn(
              "rounded px-3 py-1 text-sm",
              isActive
                ? "bg-[#1a73e8] text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            )}
            aria-pressed={isActive}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
