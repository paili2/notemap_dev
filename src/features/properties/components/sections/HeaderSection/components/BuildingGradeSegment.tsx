"use client";

import * as React from "react";
import { Button } from "@/components/atoms/Button/Button";
import { BuildingGrade } from "@/features/properties/types/building-grade";
import { cn } from "@/lib/cn";

type UiValue = "" | BuildingGrade;

type Props = {
  /**
   * value: "" | "new" | "old"
   * - ""   : 미선택
   * - "new": 신축
   * - "old": 구옥
   */
  value: UiValue;
  onChange: (v: UiValue) => void;
  className?: string;
};

export default function BuildingGradeSegment({
  value,
  onChange,
  className,
}: Props) {
  /** 🔹 실제로 파란색/흰색을 결정하는 로컬 상태 */
  const [selected, setSelected] = React.useState<UiValue>(() =>
    normalize(value)
  );

  // 모달 처음 열렸을 때 / 외부 초기값이 바뀔 때 한 번 동기화
  React.useEffect(() => {
    setSelected(normalize(value));
  }, [value]);

  const isNew = selected === "new";
  const isOld = selected === "old";

  const handleClick = (next: UiValue) => {
    // 같은 버튼 한 번 더 클릭 시 해제
    const nextVal: UiValue = next === selected ? "" : next;

    // 1) 로컬 UI 먼저 업데이트 → 클릭하면 바로 파란색 이동
    setSelected(nextVal);

    // 2) 부모(Form/useBuildingGrade)에도 알리기
    onChange(nextVal);
  };

  return (
    <div
      className={cn("inline-flex rounded-md overflow-hidden", className)}
      role="group"
      aria-label="신축/구옥"
    >
      <Button
        type="button"
        onClick={() => handleClick("new")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm rounded-r-none",
          isNew
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="신축"
        aria-pressed={isNew}
      >
        신축
      </Button>

      <Button
        type="button"
        onClick={() => handleClick("old")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm border-l rounded-l-none",
          isOld
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="구옥"
        aria-pressed={isOld}
      >
        구옥
      </Button>
    </div>
  );
}

/** "" | "new" | "old" 로 안전하게 정규화 */
function normalize(v: UiValue | null | undefined): UiValue {
  if (!v) return "";
  const s = String(v).toLowerCase();
  if (s === "new" || s === "old") return s as BuildingGrade;
  return "";
}
