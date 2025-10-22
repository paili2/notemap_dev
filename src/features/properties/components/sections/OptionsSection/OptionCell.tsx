"use client";

import * as React from "react";
import { Input } from "@/components/atoms/Input/Input";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

type OptionCellProps = {
  value?: string;
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
      <Button
        type="button"
        onClick={() => onRemove(index)}
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:text-red-600 hover:bg-transparent"
        title="입력칸 삭제"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

const OptionCell = React.memo(
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
