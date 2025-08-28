// features/properties/components/modal/common/sections/HeaderSection.tsx
"use client";

import * as React from "react";
import { X as XIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import StarsRating from "../StarsRating";

type Props = {
  // 제목
  title: string;
  setTitle: (v: string) => void;

  // 별점(1~5)
  listingStars: number;
  setListingStars: (n: number) => void;

  // 엘리베이터 O/X
  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  // 닫기
  onClose?: () => void;

  /** placeholder로 보여줄 힌트(선택) — 수정모달에서 기존 제목을 힌트로 쓰고 싶을 때 */
  placeholderHint?: string;

  /** 새로고침 동작 (선택) */
  onRefreshStars?: () => void;
};

/** 엘리베이터: K&N <-> R 스타일의 세그먼트 모양 */
function ElevatorSegment({
  value,
  onChange,
}: {
  value: "O" | "X";
  onChange: (v: "O" | "X") => void;
}) {
  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("O")}
        className={cn(
          "px-3 h-9 text-sm",
          value === "O" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
        )}
        title="엘리베이터 O"
      >
        O
      </button>
      <button
        type="button"
        onClick={() => onChange("X")}
        className={cn(
          "px-3 h-9 text-sm border-l",
          value === "X" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
        )}
        title="엘리베이터 X"
      >
        X
      </button>
    </div>
  );
}

export default function HeaderSection({
  title,
  setTitle,
  listingStars,
  setListingStars,
  elevator,
  setElevator,
  onClose,
  placeholderHint,
  onRefreshStars,
}: Props) {
  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-3 px-4 py-5 overflow-x-auto">
        {/* 매물평점 */}
        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          매물평점
        </span>
        {/* 별점 */}
        <div className="shrink-0 w-[180px] flex items-center gap-2">
          <StarsRating value={listingStars} onChange={setListingStars} />
          {listingStars > 0 && (
            <button
              type="button"
              onClick={onRefreshStars}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
              title="별점 초기화"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

        {/* 매물명 */}
        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          매물명
        </span>
        <div className="flex-1 min-w-[200px]">
          <input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.currentTarget.value)
            }
            placeholder={placeholder}
            className={cn(
              "w-full h-10 rounded-md border px-3 text-sm",
              "outline-none focus:ring-2 focus:ring-blue-200"
            )}
          />
        </div>

        {/* 구분선 */}
        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

        {/* 엘리베이터 (K&N <-> R 스타일 세그먼트 모양) */}
        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          엘리베이터
        </span>
        <ElevatorSegment value={elevator} onChange={setElevator} />

        {/* 닫기 */}
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
