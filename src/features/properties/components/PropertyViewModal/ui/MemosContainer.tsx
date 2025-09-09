"use client";
import { useState } from "react";
import MemoPanel from "../components/MemoPanel";
import { MemoTab } from "../types";

export default function MemosContainer({
  publicMemo,
  secretMemo,
}: {
  publicMemo: string;
  secretMemo: string;
}) {
  const [memoTab, setMemoTab] = useState<MemoTab>("KN");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">메모</div>
        <div className="inline-flex rounded-md border overflow-hidden">
          <button
            type="button"
            onClick={() => setMemoTab("KN")}
            className={`px-3 h-8 text-sm ${
              memoTab === "KN"
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            K&N
          </button>
          <button
            type="button"
            onClick={() => setMemoTab("R")}
            className={`px-3 h-8 text-sm border-l ${
              memoTab === "R"
                ? "bg-rose-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            R
          </button>
        </div>
      </div>

      {memoTab === "KN" ? (
        <MemoPanel mode="KN" value={publicMemo ?? ""} />
      ) : (
        <MemoPanel mode="R" value={secretMemo ?? ""} />
      )}
    </div>
  );
}
