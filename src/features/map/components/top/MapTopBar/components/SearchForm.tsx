"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/Input/Input";
import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";

type Props = {
  value?: string; // controlled
  defaultValue?: string; // uncontrolled
  onChange?: (v: string) => void;
  onSubmit?: (v: string) => void;
  onClear?: () => void; // ✅ 선택: 지우기 콜백
  placeholder?: string;
  className?: string;
};

export default function SearchForm({
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  placeholder = "장소, 주소, 버스 검색",
  className,
}: Props) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const inputValue = controlled ? (value as string) : inner;
  const hasText = useMemo(() => inputValue.trim().length > 0, [inputValue]);

  const setVal = (v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
  };

  const clear = () => {
    setVal("");
    onClear?.();
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return; // ✅ 빈 검색 방지
    onSubmit?.(q);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex h-[32px] items-center rounded-md bg-white/90 px-2 py-1 shadow-sm ring-1 ring-black/5",
        className
      )}
      role="search"
      aria-label="주소 검색"
      autoComplete="off"
    >
      <div className="relative flex-1">
        <Input
          value={inputValue}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="h-full w-full border-none bg-transparent p-0 text-sm pr-14"
          inputMode="search"
          enterKeyHint="search"
          onKeyDown={(e) => {
            if ((e as any).isComposing) return;
            if (e.key === "Enter" && !inputValue.trim()) {
              e.preventDefault();
            }
          }}
        />

        {/* 오른쪽 버튼 그룹 */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
          {hasText && (
            <button
              type="button"
              onClick={clear}
              className="h-6 w-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
              aria-label="검색어 지우기"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}

          <button
            type="submit"
            disabled={!hasText}
            className="h-6 w-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            aria-label="검색"
          >
            <Search size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  );
}
