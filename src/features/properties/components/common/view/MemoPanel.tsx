"use client";

import { cn } from "@/lib/utils";

type Props = {
  mode: "KN" | "R";
  publicMemo?: string;
  secretMemo?: string;
};

export default function MemoPanel({ mode, publicMemo, secretMemo }: Props) {
  const isR = mode === "R";
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        isR ? "bg-rose-50/70" : "bg-amber-50/60"
      )}
    >
      <div className={cn("text-sm font-medium mb-1", isR && "text-rose-600")}>
        {isR ? "리베이트 / 비밀 메모 (R)" : "특이사항(공개)"}
      </div>
      <div className="whitespace-pre-wrap text-[13px]">
        {isR ? secretMemo ?? "내부 메모" : publicMemo ?? "공개 가능한 메모"}
      </div>
    </div>
  );
}
