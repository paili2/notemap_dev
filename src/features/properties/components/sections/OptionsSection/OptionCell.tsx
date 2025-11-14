"use client";

import * as React from "react";
import { Input } from "@/components/atoms/Input/Input";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

type OptionCellProps = {
  value?: string; // undefined여도 인풋을 렌더합니다
  index: number;
  placeholder: string;
  onChangeLocal: (index: number, val: string) => void;
  onCommit?: () => void;
  onRemove: (index: number) => void;
  onAddAfter?: (index: number) => void;

  cellWidthBase?: string;
  cellWidthMd?: string;
  inputWidthBase?: string;
  inputWidthMd?: string;

  /** 직접입력 켰을 때 첫 칸 자동 포커스용(선택) */
  autoFocus?: boolean;
};

function OptionCell({
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
  autoFocus,
}: OptionCellProps) {
  // ✅ undefined일 때도 항상 컨트롤드 인풋 유지
  const safeValue = value ?? "";

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChangeLocal(index, e.target.value);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    onCommit?.();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // 엔터 시 최종 커밋
      onCommit?.();
      // 필요하면 다음 칸 추가
      if (onAddAfter) {
        onAddAfter(index);
      }
    }
  };

  return (
    <div className={`flex items-center gap-1 ${cellWidthBase} ${cellWidthMd}`}>
      <Input
        value={safeValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`h-9 ${inputWidthBase} ${inputWidthMd} shrink-0`}
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
      <Button
        type="button"
        onClick={() => onRemove(index)}
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:text-red-600 hover:bg-transparent"
        title="입력칸 삭제"
        aria-label="입력칸 삭제"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default OptionCell;
