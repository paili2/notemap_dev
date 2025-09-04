"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import StarsRating from "@/components/molecules/StarsRating";
import ElevatorSegment from "./components/ElevatorSegment";

import type { HeaderSectionProps } from "./types";
import PinTypeSelect from "./components/PinTypeSelect";
import { PinKind } from "@/features/map/pins";

export type HeaderSectionExtraProps = {
  /** 선택된 핀 종류 (매물 타입) */
  pinKind: PinKind;
  /** 핀 종류 변경 핸들러 */
  setPinKind: (v: PinKind) => void;
};

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
  /** ▼ 새로 추가된 prop 두 개 */
  pinKind,
  setPinKind,
}: HeaderSectionProps & HeaderSectionExtraProps) {
  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-3 px-4 py-5 overflow-x-auto">
        {/* ✅ 핀 종류 드롭다운 (맨 왼쪽) */}
        <PinTypeSelect
          value={pinKind}
          onChange={setPinKind}
          className="w-[230px] h-9 shrink-0"
          placeholder="핀 종류 선택"
        />

        {/* 구분선 */}
        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

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

        {/* 엘리베이터 */}
        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          엘리베이터
        </span>
        <ElevatorSegment value={elevator} onChange={setElevator} />

        {/* 닫기 버튼은 필요 시 복구 */}
        {/*
        <button
          type="button"
          onClick={onClose}
          className="ml-2 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="닫기"
        >
          <XIcon className="h-4 w-4 text-gray-700" />
        </button>
        */}
      </div>
    </header>
  );
}
