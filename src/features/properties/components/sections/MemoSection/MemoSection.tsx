"use client";

import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { cn } from "@/lib/cn";
import { useEffect, useRef } from "react";
import { MemoSectionProps } from "./types";

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
}: MemoSectionProps) {
  const labelText = mode === "KN" ? "특이사항(공개)" : "비밀 메모";
  const hint =
    placeholder ?? (mode === "KN" ? "공개 가능한 메모" : "내부 메모");
  const inputId = id ?? (mode === "KN" ? "memo-public" : "memo-secret");

  const ref = useRef<HTMLTextAreaElement | null>(null);

  // autoGrow: 입력할 때마다 높이 재계산
  useEffect(() => {
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
