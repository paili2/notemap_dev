"use client";
import { cn } from "@/lib/cn";
import SearchForm from "./components/SearchForm";
import type { MapTopBarProps } from "./types";

export default function MapTopBar({
  className,
  value,
  defaultValue,
  onChangeSearch,
  onSubmitSearch,
  onClearSearch,
  placeholder,
  wrapOnMobile = true,
}: MapTopBarProps) {
  return (
    <div
      className={cn(
        wrapOnMobile ? "flex flex-wrap md:flex-nowrap" : "flex flex-nowrap",
        // 컨테이너는 클릭을 '통과'시킴
        "pointer-events-none absolute left-3 top-3 z-[70] items-center gap-2",
        className
      )}
      role="region"
      aria-label="지도 상단 검색"
    >
      {/* 내부만 클릭 가능 */}
      <div className="pointer-events-auto">
        <SearchForm
          value={value}
          defaultValue={defaultValue}
          onChange={onChangeSearch}
          onSubmit={onSubmitSearch}
          onClear={onClearSearch}
          placeholder={placeholder}
          className="flex-1 min-w-[200px] md:min-w-[260px] max-w-[420px]"
        />
      </div>
    </div>
  );
}
