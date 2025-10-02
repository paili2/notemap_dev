"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/atoms/Button/Button";
import { Eye } from "lucide-react";
import SearchForm from "./components/SearchForm";
import type { MapTopBarProps } from "./types";

/**
 * 지도 상단 검색/컨트롤 바
 * - pointer-events-none 컨테이너에 내부 요소만 클릭 가능하도록 pointer-events-auto 적용
 * - 로드뷰 버튼은 선택 프롭(onOpenRoadviewAtCenter) 전달 시 노출
 */
export default function MapTopBar({
  className,
  value,
  defaultValue,
  onChangeSearch,
  onSubmitSearch,
  onClearSearch,
  placeholder,
  wrapOnMobile = true,
  onOpenRoadviewAtCenter, // optional: 맵 중심 로드뷰 열기
}: MapTopBarProps & {
  onOpenRoadviewAtCenter?: () => void;
}) {
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
      {/* 검색폼 */}
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
