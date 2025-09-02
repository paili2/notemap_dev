"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/Input/Input";
import { useState } from "react";

type Props = {
  value?: string; // controlled
  defaultValue?: string; // uncontrolled
  onChange?: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchForm({
  value,
  defaultValue,
  onChange,
  onSubmit,
  placeholder = "장소, 주소, 버스 검색",
  className,
}: Props) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const inputValue = controlled ? (value as string) : inner;

  const setVal = (v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmit?.(inputValue.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex h-[32px] items-center gap-1 rounded-md bg-white/90 px-2 py-1 shadow-sm ring-1 ring-black/5",
        className
      )}
      role="search"
      aria-label="주소 검색"
    >
      <Input
        value={inputValue}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="h-full flex-1 border-none bg-transparent p-0 text-sm"
      />

      <button
        type="submit"
        className="flex h-full items-center rounded px-2 text-gray-500 hover:bg-gray-100"
        aria-label="검색"
      >
        <Search size={16} />
      </button>
    </form>
  );
}
