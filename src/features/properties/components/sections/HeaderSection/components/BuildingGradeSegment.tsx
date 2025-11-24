"use client";

import { Button } from "@/components/atoms/Button/Button";
import { BuildingGrade } from "@/features/properties/types/building-grade";
import { cn } from "@/lib/cn";

type Props = {
  /**
   * value: "" | "new" | "old"
   * - ""   : 미선택
   * - "new": 신축
   * - "old": 구옥
   */
  value: "" | BuildingGrade;
  onChange: (v: "" | BuildingGrade) => void;
  className?: string;
};

export default function BuildingGradeSegment({
  value,
  onChange,
  className,
}: Props) {
  return (
    <div
      className={cn("inline-flex rounded-md overflow-hidden", className)}
      role="group"
      aria-label="신축/구옥"
    >
      <Button
        type="button"
        onClick={() => onChange("new")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm rounded-r-none",
          value === "new"
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="신축"
        aria-pressed={value === "new"}
      >
        신축
      </Button>

      <Button
        type="button"
        onClick={() => onChange("old")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm border-l rounded-l-none",
          value === "old"
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="구옥"
        aria-pressed={value === "old"}
      >
        구옥
      </Button>
    </div>
  );
}
