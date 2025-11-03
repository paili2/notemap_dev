"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import StarsRating from "@/components/molecules/StarsRating";
import { HeaderSectionViewProps } from "./types";
import { getPinUrl } from "@/features/pins/lib/assets";
import StarMeter from "../../ui/StarMeter";

export default function HeaderSectionView({
  title,
  parkingGrade,
  elevator, // "O" | "X" | undefined
  pinKind = "1room",
  onClose,
  closeButtonRef,
  headingId,
  descId,
}: HeaderSectionViewProps) {
  const pinSrc = useMemo(() => getPinUrl(pinKind), [pinKind]);

  // ✅ 문자열/숫자 변환: "3" → 3, undefined/null → 0
  const rating = useMemo(() => {
    const n =
      typeof parkingGrade === "number"
        ? parkingGrade
        : Number.parseInt(String(parkingGrade ?? "0"), 10);
    return Math.max(0, Math.min(5, Number.isFinite(n) ? n : 0));
  }, [parkingGrade]);

  // 표기용 매물명 (공백 제거 → 빈 값이면 "-")
  const displayTitle = useMemo(() => {
    const s = typeof title === "string" ? title.trim() : "";
    return s.length ? s : "-";
  }, [title]);

  // 엘리베이터 표시: O / X / - (미지정)
  const elevLabel = elevator ?? "-";
  const elevClass =
    elevLabel === "O"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : elevLabel === "X"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-gray-50 border-gray-200 text-gray-600";

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-5 whitespace-nowrap overflow-hidden">
        {/* 핀 아이콘 */}
        <div className="shrink-0 w-7 h-7 md:w-9 md:h-9 grid place-items-center">
          <Image
            src={pinSrc}
            alt={`${pinKind} 핀`}
            width={24}
            height={32}
            priority={true}
          />
        </div>

        {/* 데스크탑에서만 라벨 */}
        <span className="shrink-0 text-[20px] font-semibold text-gray-800 hidden md:flex">
          매물평점
        </span>

        {/* 데스크탑: StarsRating / 모바일: StarMeter */}
        <div className="shrink-0 w-[120px] md:w-[200px] leading-none">
          <div className="hidden md:flex items-center">
            <StarsRating value={rating} className="leading-none antialiased" />
          </div>
          <div className="flex md:hidden items-center">
            <StarMeter value={rating} showValue />
          </div>
        </div>

        {/* 구분선 (모바일에선 숨김) */}
        <div className="h-5 w-px bg-gray-200 mx-1 shrink-0 hidden sm:block" />

        {/* 데스크탑에서만 라벨 */}
        <span className="shrink-0 text-[20px] font-semibold text-gray-800 hidden md:flex">
          매물명
        </span>

        {/* 제목: 줄바꿈 없이 말줄임 */}
        <div className="flex-1 min-w-0 text-xl text-slate-900">
          <div className="h-9 md:h-10 flex items-center px-2 md:px-3 rounded-md bg-white">
            <span
              id={headingId}
              className="truncate text-lg font-medium"
              title={displayTitle}
            >
              {displayTitle}
            </span>
            {descId && (
              <span id={descId} className="sr-only">
                매물 상세 보기 모달
              </span>
            )}
          </div>
        </div>

        {/* 구분선 (모바일 숨김) */}
        <div className="h-5 w-px bg-gray-200 mx-1 shrink-0 hidden sm:block" />

        {/* 엘리베이터 */}
        <span className="shrink-0 font-medium text-gray-800 text-sm md:text-[20px]">
          엘리베이터
        </span>
        <span
          className={cn(
            "inline-flex h-8 md:h-9 items-center rounded-md border px-2 md:px-3 text-xs md:text-sm font-bold shrink-0",
            elevClass
          )}
          title="엘리베이터 유무"
          aria-live="polite"
        >
          {elevLabel}
        </span>

        {/* 닫기 버튼 */}
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md border px-3 h-9 hover:bg-muted"
          aria-label="닫기"
          title="닫기"
        >
          닫기
        </button>
      </div>
    </header>
  );
}
