"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number; // 0~5
  onChange?: (n: number) => void;
  readOnly?: boolean;
  /** 같은 별을 다시 누르면 0으로 초기화 (기본 true) */
  allowClear?: boolean;
  /** 크기 */
  size?: "sm" | "md";
  /** 스크린리더 라벨 */
  ariaLabel?: string;
};

export default function StarsRating({
  value,
  onChange,
  readOnly = false,
  allowClear = true,
  size = "md",
  ariaLabel = "별점 선택",
}: Props) {
  const [hover, setHover] = React.useState<number | null>(null);
  const effective = hover ?? value;
  const canInteract = !!onChange && !readOnly;

  const setRating = (n: number) => {
    if (!canInteract) return;
    if (allowClear && n === value) onChange?.(0);
    else onChange?.(n);
  };

  // 키보드 접근성
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!canInteract) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange?.(Math.max(0, value - 1));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange?.(Math.min(5, value + 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange?.(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange?.(5);
    }
  };

  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-readonly={readOnly || undefined}
      tabIndex={canInteract ? 0 : -1}
      onKeyDown={onKeyDown}
      className="inline-flex items-center gap-1 outline-none focus:ring-2 focus:ring-blue-200 rounded"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= effective;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n <= value}
            disabled={!canInteract}
            onMouseEnter={() => canInteract && setHover(n)}
            onFocus={() => canInteract && setHover(null)}
            onClick={() => setRating(n)}
            className={cn(
              "p-0.5",
              canInteract ? "cursor-pointer" : "cursor-default",
              "disabled:opacity-60"
            )}
            title={`${n}점`}
          >
            <Star
              // stroke 색상은 text-*, 채우기는 fill={currentColor}로 제어
              className={cn(
                starSize,
                active ? "text-amber-500" : "text-gray-300"
              )}
              strokeWidth={1.75}
              // lucide Star는 path fill="none"이 기본이므로,
              // svg에 fill을 직접 주어 채워줍니다.
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}
