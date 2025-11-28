"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import StarsRating from "@/components/molecules/StarsRating";
import { HeaderSectionViewProps } from "./types";
import { getPinUrl } from "@/features/pins/lib/assets";
import StarMeter from "../../ui/StarMeter";
import { getAgeLabel } from "@/features/properties/lib/ageLabel";

export default function HeaderSectionView({
  title,
  parkingGrade,
  pinKind = "1room",
  onClose,
  closeButtonRef,
  headingId,
  descId,
  // 연식
  ageType,
  completionDate,
  newYearsThreshold = 5,
  // ⭐ 리베이트 텍스트(만원 단위)
  rebateText,
}: HeaderSectionViewProps) {
  const pinSrc = useMemo(() => getPinUrl(pinKind), [pinKind]);

  const rating = useMemo(() => {
    const n =
      typeof parkingGrade === "number"
        ? parkingGrade
        : Number.parseInt(String(parkingGrade ?? "0"), 10);
    return Math.max(0, Math.min(5, Number.isFinite(n) ? n : 0));
  }, [parkingGrade]);

  const displayTitle = useMemo(() => {
    const s = typeof title === "string" ? title.trim() : "";
    return s.length ? s : "-";
  }, [title]);

  const ageLabel = useMemo<"신축" | "구옥" | "-">(() => {
    // 서버 ageType → getAgeLabel 에서 쓰는 isNew/isOld 플래그로 변환
    const isNewFlag =
      ageType === "NEW" ? true : ageType === "OLD" ? false : null;
    const isOldFlag =
      ageType === "OLD" ? true : ageType === "NEW" ? false : null;

    return getAgeLabel({
      isNew: isNewFlag,
      isOld: isOldFlag,
      completionDate: completionDate ?? null,
      newYearsThreshold,
    });
  }, [ageType, completionDate, newYearsThreshold]);

  const ageClass =
    ageLabel === "신축"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : ageLabel === "구옥"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-gray-50 border-gray-200 text-gray-500";

  // 🔢 리베이트 표시용 문자열 (0이하 / 비어있으면 숨김)
  const rebateDisplay = useMemo(() => {
    if (rebateText === null || rebateText === undefined) return null;
    const raw = String(rebateText).trim();
    if (!raw) return null;

    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return null;

    return n.toLocaleString("ko-KR");
  }, [rebateText]);

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-5 whitespace-nowrap overflow-hidden">
        <span
          className={cn(
            "inline-flex h-8 md:h-9 items-center rounded-md border px-2 md:px-3 text-xs md:text-sm font-bold shrink-0",
            ageClass
          )}
        >
          {ageLabel}
        </span>

        {/* 핀 아이콘 */}
        <div className="shrink-0 w-7 h-7 md:w-9 md:h-9 grid place-items-center">
          <Image src={pinSrc} alt="pin" width={24} height={32} priority />
        </div>

        {/* 평점 */}
        <span className="hidden md:flex shrink-0 text-[20px] font-semibold text-gray-800">
          매물평점
        </span>
        <div className="shrink-0 w-[120px] md:w-[200px] leading-none">
          <StarsRating value={rating} className="hidden md:flex" />
          <div className="flex md:hidden">
            <StarMeter value={rating} showValue />
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-5 w-px bg-gray-200 mx-1 shrink-0 hidden sm:block" />

        {/* 매물명 */}
        <span className="hidden md:flex shrink-0 text-[20px] font-semibold text-gray-800">
          매물명
        </span>
        <div className="flex-1 min-w-0 text-xl text-slate-900">
          <div className="h-9 md:h-10 flex items-center px-2 md:px-3 rounded-md bg-white">
            <span className="truncate text-lg font-medium">{displayTitle}</span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-5 w-px bg-gray-200 mx-1 shrink-0 hidden sm:block" />

        {/* 🔥 리베이트 표시 */}
        {rebateDisplay && (
          <div className="shrink-0 flex items-center gap-3">
            <span className="flex items-center h-9 text-[20px] md:text-[22px] font-extrabold text-red-500">
              R
            </span>
            <div
              className={cn(
                "min-w-[2rem] h-9 px-2 text-right",
                "flex items-center justify-end",
                "text-[20px] md:text-[22px] font-extrabold",
                "text-gray-400 bg-white"
              )}
            >
              {rebateDisplay}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
