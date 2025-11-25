"use client";

import { cn } from "@/lib/cn";

export default function MemoPanel({
  mode,
  value,
}: {
  mode: "KN" | "R";
  value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        mode === "KN" ? "bg-amber-50/60" : "bg-rose-50/70"
      )}
    >
      <div
        className={cn(
          "text-sm font-medium mb-1",
          mode === "R" && "text-rose-600"
        )}
      >
        {mode === "KN" ? "특이사항(공개)" : "비밀 메모"}
      </div>
      <div className="min-h-[72px] whitespace-pre-wrap text-sm">
        {value?.trim() ? (
          value
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    </div>
  );
}
