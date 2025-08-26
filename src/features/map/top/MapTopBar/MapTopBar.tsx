"use client";

import { cn } from "@/lib/utils";
import FilterGroup from "./components/FilterGroup";
import SearchForm from "./components/SearchForm";
import type { MapTopBarProps } from "./types";

export default function MapTopBar({
  className,
  active = "all",
  onChangeFilter,
  value,
  defaultValue,
  onChangeSearch,
  onSubmitSearch,
  placeholder,
}: MapTopBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute left-3 top-3 z-50 flex items-center gap-2",
        className
      )}
      role="region"
      aria-label="지도 상단 필터와 검색"
    >
      <FilterGroup active={active} onChange={onChangeFilter} />
      <SearchForm
        value={value}
        defaultValue={defaultValue}
        onChange={onChangeSearch}
        onSubmit={onSubmitSearch}
        placeholder={placeholder}
      />
    </div>
  );
}
