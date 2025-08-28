// features/properties/components/modal/common/sections/MemoSection.tsx
"use client";

import * as React from "react";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { cn } from "@/lib/utils";

type Props = {
  mode: "KN" | "R";
  value: string;
  setValue: (v: string) => void;

  // 🔽 모두 선택 사항 (기존 호출부 영향 없음)
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number; // 기본 3
  maxLength?: number; // 지정 시 카운터 표시 가능
  showCount?: boolean; // 기본 true (maxLength 있을 때만)
  autoGrow?: boolean; // 내용에 따라 높이 자동 확장 (기본 false)
  className?: string;
};

export default function MemoSection({
  mode,
  value,
  setValue,
  id,
  placeholder,
  disabled,
  rows = 3,
  maxLength,
  showCount = true,
  autoGrow = false,
  className,
}: Props) {
  const labelText =
    mode === "KN" ? "특이사항(공개)" : "리베이트 / 비밀 메모 (R)";
  const hint =
    placeholder ?? (mode === "KN" ? "공개 가능한 메모" : "내부 메모");
  const inputId = id ?? (mode === "KN" ? "memo-public" : "memo-secret");

  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  // autoGrow: 입력할 때마다 높이 재계산
  React.useEffect(() => {
    if (!autoGrow || !ref.current) return;
    const el = ref.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, autoGrow]);

  return (
    <div
      className={cn(
        "rounded-md border p-3",
        mode === "KN" ? "bg-amber-50/60" : "bg-rose-50/70",
        className
      )}
    >
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium mb-1 block",
          mode === "R" && "text-rose-600"
        )}
      >
        {labelText}
      </label>

      <div className="relative">
        <Textarea
          id={inputId}
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={hint}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          className={cn("resize-y w-full", autoGrow && "overflow-hidden")}
          aria-label={labelText}
        />

        {typeof maxLength === "number" && showCount && (
          <div className="pointer-events-none absolute right-2 bottom-1 text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
}
