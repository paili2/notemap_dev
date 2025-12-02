"use client";

import MemoPanel from "../../sections/MemoPanel";
import { MemoTab } from "../../types";
import { useMemoViewMode } from "@/features/properties/store/useMemoViewMode";

export default function MemosContainer({
  publicMemo = "",
  secretMemo = "",
}: {
  publicMemo?: string;
  secretMemo?: string;
}) {
  // 전역 K&N / R 상태 ("public" | "secret")
  const mode = useMemoViewMode((s) => s.mode);

  const isPublic = mode === "public";
  const memoTab: MemoTab = isPublic ? "KN" : "R";
  const value = isPublic ? publicMemo : secretMemo;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">메모</div>
        {/* 👉 여기서는 더 이상 KN/R 토글 버튼 안 보이게 */}
      </div>

      {memoTab === "KN" ? (
        <MemoPanel mode="KN" value={value} />
      ) : (
        <MemoPanel mode="R" value={value} />
      )}
    </div>
  );
}
