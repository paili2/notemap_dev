"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/Input/Input";
import { useState } from "react";

export type FilterKey = "all" | "new" | "old" | "fav";

type Props = {
  className?: string;
  active?: FilterKey;
  onChangeFilter?: (k: FilterKey) => void;
  value?: string;
  defaultValue?: string;
  onChangeSearch?: (v: string) => void;
  onSubmitSearch?: (v: string) => void;
  placeholder?: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "new", label: "신축" },
  { key: "old", label: "구옥" },
  { key: "fav", label: "즐겨찾기" },
];

export default function MapTopBar({
  className,
  active = "all",
  onChangeFilter,
  value,
  defaultValue,
  onChangeSearch,
  onSubmitSearch,
  placeholder = "장소, 주소, 버스 검색",
}: Props) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const inputValue = controlled ? (value as string) : inner;

  const setVal = (v: string) => {
    if (!controlled) setInner(v);
    onChangeSearch?.(v);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmitSearch?.(inputValue.trim());
  };

  return (
    <div
      className={cn(
        "pointer-events-auto absolute left-3 top-3 z-50 flex items-center gap-2",
        className
      )}
      role="region"
      aria-label="지도 상단 필터와 검색"
    >
      {/* 필터 버튼 그룹 */}
      <div className="flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 shadow-sm ring-1 ring-black/5">
        {FILTERS.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onChangeFilter?.(f.key)}
              className={cn(
                "rounded px-3 py-1 text-sm",
                isActive
                  ? "bg-[#1a73e8] text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              )}
              aria-pressed={isActive}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* 주소 검색 인풋 */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 shadow-sm ring-1 ring-black/5 h-[32px]"
        role="search"
        aria-label="주소 검색"
      >
        <Input
          value={inputValue}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-none bg-transparent p-0 text-sm h-full"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setVal("")}
            aria-label="입력 지우기"
            className="rounded-md p-1 hover:bg-gray-100 h-full flex items-center"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="submit"
          className="rounded text-gray-500 px-2 hover:bg-gray-100 h-full flex items-center"
        >
          <Search size={16} />
        </button>
      </form>
    </div>
  );
}
