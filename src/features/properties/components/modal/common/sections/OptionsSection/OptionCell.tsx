"use client";

import * as React from "react";
import { Input } from "@/components/atoms/Input/Input";
import { X } from "lucide-react";

export type OptionCellProps = {
  value?: string; // undefined면 placeholder 칸 유지
  index: number; // 부모 배열 인덱스
  placeholder: string;
  onChangeLocal: (index: number, val: string) => void; // 로컬만 수정
  onCommit?: () => void; // blur 등 커밋 시 호출(옵션 동기화)
  onRemove: (index: number) => void;
  onAddAfter?: (index: number) => void;

  cellWidthBase?: string; // ex) "w-[200px]"
  cellWidthMd?: string; // ex) "md:w-[220px]"
  inputWidthBase?: string; // ex) "w-[160px]"
  inputWidthMd?: string; // ex) "md:w-[180px]"
};

function OptionCellImpl({
  value,
  index,
  placeholder,
  onChangeLocal,
  onCommit,
  onRemove,
  onAddAfter,
  cellWidthBase = "w-[200px]",
  cellWidthMd = "md:w-[220px]",
  inputWidthBase = "w-[160px]",
  inputWidthMd = "md:w-[180px]",
}: OptionCellProps) {
  if (value === undefined) {
    // 빈 자리: 높이만 맞춰 그리드 안정화
    return <div className={`h-9 ${cellWidthBase} ${cellWidthMd}`} />;
  }

  return (
    <div className={`flex items-center gap-1 ${cellWidthBase} ${cellWidthMd}`}>
      <Input
        value={value}
        onChange={(e) => onChangeLocal(index, e.target.value)}
        onBlur={() => onCommit?.()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onAddAfter) {
            e.preventDefault();
            onAddAfter(index);
          }
        }}
        placeholder={placeholder}
        className={`h-9 ${inputWidthBase} ${inputWidthMd} shrink-0`}
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-sm px-1 text-gray-500 hover:text-red-600"
        title="입력칸 삭제"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** prop이 동일하면 리렌더 최소화 */
export const OptionCell = React.memo(
  OptionCellImpl,
  (prev, next) =>
    prev.value === next.value &&
    prev.index === next.index &&
    prev.placeholder === next.placeholder &&
    prev.cellWidthBase === next.cellWidthBase &&
    prev.cellWidthMd === next.cellWidthMd &&
    prev.inputWidthBase === next.inputWidthBase &&
    prev.inputWidthMd === next.inputWidthMd
);

export default OptionCell;
