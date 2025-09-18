"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value?: number; // 0~max
  max?: number; // 기본 5 (value/max 비율로 1개 별 채움)
  size?: "sm" | "md" | "lg";
  showValue?: boolean; // 1.0 형식 숫자 표시
  className?: string;
};

export default function StarMeter({
  value = 0,
  max = 5,
  size = "md",
  showValue = false,
  className,
}: Props) {
  const v = Math.max(0, Math.min(max, value));
  const pct = (v / max) * 100;

  const starSize =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div
      className={cn("inline-flex items-center", className)}
      aria-label={`평점 ${v.toFixed(1)} / ${max}`}
    >
      {/* 한 개의 둥근 별: 회색 베이스 */}
      <span className="relative inline-block">
        <Star
          className={cn(starSize, "block text-gray-300")}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          aria-hidden
        />
        {/* 채움: 노란 별을 가로 폭으로 마스킹 */}
        <span
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          <Star
            className={cn(starSize, "block text-amber-500")}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="currentColor"
          />
        </span>
      </span>

      {showValue && (
        <span className="ml-1 text-sm md:text-sm tabular-nums font-medium">
          {v.toFixed(1)}
        </span>
      )}
    </div>
  );
}
