"use client";

import { X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import StarsRating from "../../common/StarsRating";

export default function HeaderSectionView({
  title,
  listingStars,
  elevator,
  onClose,
}: {
  title: string;
  listingStars: number;
  elevator: "O" | "X";
  onClose?: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-3 px-4 py-5 overflow-x-auto">
        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          매물평점
        </span>
        <div className="shrink-0 w-[180px]">
          <StarsRating value={listingStars} readOnly />
        </div>

        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          매물명
        </span>
        <div className="flex-1 min-w-[200px] text-xl text-slate-900">
          <div className="h-10 flex items-center px-3 rounded-md bg-white">
            <span className="truncate">{title || "-"}</span>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          엘리베이터
        </span>
        <span
          className={cn(
            "inline-flex h-9 items-center rounded-md border px-3 text-sm font-bold",
            elevator === "O"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}
          title="엘리베이터 유무"
        >
          {elevator}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="ml-2 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="닫기"
        >
          <XIcon className="h-4 w-4 text-gray-700" />
        </button>
      </div>
    </header>
  );
}
