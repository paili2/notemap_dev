// src/features/properties/components/PropertyViewModal/ui/StarMeter.tsx
"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value?: number; // 0~5
  max?: number; // 별 개수(기본 5)
  size?: "sm" | "md"; // StarsRating과 동일 토큰
  showValue?: boolean; // 숫자 표시
  className?: string;
};

export default function StarMeter({
  value = 0,
  max = 5,
  size = "md",
  showValue = false,
  className,
}: Props) {
  const count = Math.max(1, Math.round(max));
  const v = Math.max(0, Math.min(count, value));
  const pct = (v / count) * 100;

  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const gap = "gap-1";

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      aria-label={`평점 ${v.toFixed(1)} / ${count}`}
    >
      {/* 바닥층: 회색 윤곽(StarsRating의 비활성 상태와 동일) */}
      <div className={cn("inline-flex items-center", gap)} aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <Star
            key={`base-${i}`}
            className={cn(starSize, "block text-gray-300")}
            strokeWidth={2}
            fill="none"
          />
        ))}
      </div>

      {/* 채움층: 노란 별을 가로 폭으로 마스킹 */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        <div className={cn("inline-flex items-center", gap)}>
          {Array.from({ length: count }).map((_, i) => (
            <Star
              key={`fill-${i}`}
              className={cn(starSize, "block text-amber-500")}
              strokeWidth={2}
              fill="currentColor"
            />
          ))}
        </div>
      </div>

      {showValue && (
        <span className="ml-1 text-xs tabular-nums">{v.toFixed(1)}</span>
      )}
    </div>
  );
}
