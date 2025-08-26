"use client";

import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { cn } from "@/lib/utils";

type Props = {
  mode: "KN" | "R";
  value: string;
  setValue: (v: string) => void;
};

export default function MemoSection({ mode, value, setValue }: Props) {
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
        {mode === "KN" ? "특이사항(공개)" : "리베이트 / 비밀 메모 (R)"}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={mode === "KN" ? "공개 가능한 메모" : "내부 메모"}
        rows={3}
        className="resize-y"
      />
    </div>
  );
}
