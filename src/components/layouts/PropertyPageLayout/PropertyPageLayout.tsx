"use client";

import { cn } from "@/lib/utils";

export interface PropertyPageLayoutProps {
  /** 지도 영역 */
  map: React.ReactNode;
  /** 리스트 영역 */
  list: React.ReactNode;
  /** 상단 툴바 (검색, 필터 등) */
  toolbar?: React.ReactNode;
  className?: string;
}

/**
 * PropertyPageLayout
 * - 좌측: 리스트 / 우측: 지도
 * - 모바일에서는 위쪽: 지도 / 아래쪽: 리스트
 */
export function PropertyPageLayout({
  map,
  list,
  toolbar,
  className,
}: PropertyPageLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      {toolbar && (
        <div className="border-b bg-background px-4 py-3">{toolbar}</div>
      )}

      {/* Content area */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* 리스트 영역 */}
        <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r overflow-auto">
          {list}
        </div>

        {/* 지도 영역 */}
        <div className="lg:w-1/2 flex-1">{map}</div>
      </div>
    </div>
  );
}
