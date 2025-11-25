"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import StarsRating from "@/components/molecules/StarsRating";
import { HeaderSectionViewProps } from "./types";
import { getPinUrl } from "@/features/pins/lib/assets";
import StarMeter from "../../ui/StarMeter";
import { getAgeLabel } from "@/features/properties/lib/ageLabel";

/* ───────────── 유틸: 안전 불리언 정규화 ───────────── */
function normalizeBool(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  if (typeof v === "number") return v !== 0;
  return null;
}

function fromBuildingAgeType(t: "NEW" | "OLD" | "" | null | undefined): {
  isNew: boolean | null;
  isOld: boolean | null;
} {
  if (t === "NEW") return { isNew: true, isOld: false };
  if (t === "OLD") return { isNew: false, isOld: true };
  return { isNew: null, isOld: null };
}

function resolveAgeFlags(opts: {
  isNewRaw?: boolean | null | string | number;
  isOldRaw?: boolean | null | string | number;
  buildingAgeType?: "NEW" | "OLD" | "" | null;
}): { isNew: boolean | undefined; isOld: boolean | undefined } {
  const nIsNew = normalizeBool(opts.isNewRaw);
  const nIsOld = normalizeBool(opts.isOldRaw);

  if (nIsOld === true && nIsNew !== true) {
    return { isNew: false, isOld: true };
  }
  if (nIsNew === true && nIsOld !== true) {
    return { isNew: true, isOld: false };
  }
  if (nIsOld === true && nIsNew === true) {
    return { isNew: false, isOld: true };
  }

  const byType = fromBuildingAgeType(opts.buildingAgeType);
  if (byType.isNew !== null || byType.isOld !== null) {
    return {
      isNew: byType.isNew === null ? undefined : byType.isNew,
      isOld: byType.isOld === null ? undefined : byType.isOld,
    };
  }

  return { isNew: undefined, isOld: undefined };
}

export default function HeaderSectionView({
  title,
  parkingGrade,
  pinKind = "1room",
  onClose,
  closeButtonRef,
  headingId,
  descId,
  // 연식
  isNew,
  isOld,
  buildingAgeType,
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
    const { isNew: finalIsNew, isOld: finalIsOld } = resolveAgeFlags({
      isNewRaw: isNew,
      isOldRaw: isOld,
      buildingAgeType:
        typeof buildingAgeType === "string"
          ? (buildingAgeType.toUpperCase() as "NEW" | "OLD" | "")
          : undefined,
    });

    const label = getAgeLabel({
      isNew: finalIsNew,
      isOld: finalIsOld,
      completionDate: completionDate ?? null,
      newYearsThreshold,
    });

    return label;
  }, [isNew, isOld, buildingAgeType, completionDate, newYearsThreshold]);

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

        {/* 🔥 리베이트 표시: 입력 헤더처럼 R + 박스, 인풋 없는 읽기 전용 */}
        {rebateDisplay && (
          <div className="shrink-0 flex items-center gap-3">
            {/* ✅ R: h-9 + flex items-center 로 숫자와 동일 높이/정렬 */}
            <span className="flex items-center h-9 text-[20px] md:text-[22px] font-extrabold text-red-500">
              R
            </span>

            {/* 값 박스 – 인풋 대신 읽기 전용 박스 */}
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
