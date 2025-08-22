// 주차 별점

// features/properties/components/common/StarsRating.tsx
"use client";

import * as React from "react";
import { Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";

type Props = {
  value: number; // 0~5
  onChange: (n: number) => void; // 클릭 시 별 개수 전달
  showReset?: boolean; // 초기화 버튼 노출 여부
};

export default function StarsRating({
  value,
  onChange,
  showReset = true,
}: Props) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`별 ${n}개`}
            className="p-1 leading-none"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                active ? "fill-amber-400 text-amber-400" : "text-gray-300"
              )}
            />
          </button>
        );
      })}
      {showReset && value > 0 && (
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => onChange(0)}
          title="초기화"
          className="ml-1"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
