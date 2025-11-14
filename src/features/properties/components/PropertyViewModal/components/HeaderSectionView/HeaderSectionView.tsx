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

/* ───────────── buildingAgeType → 불리언 ───────────── */
function fromBuildingAgeType(t: "NEW" | "OLD" | "" | null | undefined): {
  isNew: boolean | null;
  isOld: boolean | null;
} {
  if (t === "NEW") return { isNew: true, isOld: false };
  if (t === "OLD") return { isNew: false, isOld: true };
  return { isNew: null, isOld: null };
}

/* ───────────── 최종 플래그 결정(우선순위) ─────────────
   1) 명시 isNew/isOld (문자열/숫자 포함 정규화)
      → ⚠️ isOld 가 true 면 구옥 우선
   2) buildingAgeType ("NEW"/"OLD")
   completionDate 보정은 getAgeLabel 내부에서 수행
*/
function resolveAgeFlags(opts: {
  isNewRaw?: boolean | null | string | number;
  isOldRaw?: boolean | null | string | number;
  buildingAgeType?: "NEW" | "OLD" | "" | null;
}): { isNew: boolean | undefined; isOld: boolean | undefined } {
  const nIsNew = normalizeBool(opts.isNewRaw);
  const nIsOld = normalizeBool(opts.isOldRaw);

  // 1) 명시 불리언 우선
  //    👉 둘 다 true 인 경우에도 "구옥" 우선
  if (nIsOld === true && nIsNew !== true) {
    return { isNew: false, isOld: true };
  }
  if (nIsNew === true && nIsOld !== true) {
    return { isNew: true, isOld: false };
  }
  if (nIsOld === true && nIsNew === true) {
    // 둘 다 true 라면 구옥으로 고정
    return { isNew: false, isOld: true };
  }
  if (nIsNew === false && nIsOld === false) {
    return { isNew: undefined, isOld: undefined };
  }

  // 2) 타입 문자열 (NEW/OLD)
  const byType = fromBuildingAgeType(opts.buildingAgeType);
  if (byType.isNew !== null || byType.isOld !== null) {
    return {
      isNew: byType.isNew === null ? undefined : byType.isNew,
      isOld: byType.isOld === null ? undefined : byType.isOld,
    };
  }

  // 판단 재료 없음
  return { isNew: undefined, isOld: undefined };
}

export default function HeaderSectionView({
  title,
  parkingGrade,
  elevator,
  pinKind = "1room",
  onClose, // 사용 중이면 유지
  closeButtonRef,
  headingId,
  descId,
  // ⬇️ 연식 관련
  isNew,
  isOld,
  buildingAgeType,
  completionDate,
  newYearsThreshold = 5,
}: HeaderSectionViewProps) {
  const pinSrc = useMemo(() => getPinUrl(pinKind), [pinKind]);

  // 평점 숫자 변환
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

  // 엘리베이터 라벨/스타일
  const elevLabel = elevator ?? "-";
  const elevClass =
    elevLabel === "O"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : elevLabel === "X"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-gray-50 border-gray-200 text-gray-600";

  // ✅ 신축/구옥 라벨 계산 (구옥 우선)
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

    console.log("[HeaderSectionView] age label debug", {
      inputs: {
        isNew,
        isOld,
        buildingAgeType,
        completionDate,
        newYearsThreshold,
      },
      normalized: { finalIsNew, finalIsOld },
      label,
    });

    return label;
  }, [isNew, isOld, buildingAgeType, completionDate, newYearsThreshold]);

  // 신축/구옥 뱃지 색상 (정보 없음일 때는 중립)
  const ageClass =
    ageLabel === "신축"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : ageLabel === "구옥"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-gray-50 border-gray-200 text-gray-500";

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-5 whitespace-nowrap overflow-hidden">
        {/* 🔵 신축/구옥 뱃지 */}
        <span
          className={cn(
            "inline-flex h-8 md:h-9 items-center rounded-md border px-2 md:px-3 text-xs md:text-sm font-bold shrink-0",
            ageClass
          )}
          title="신축/구옥"
          aria-live="polite"
        >
          {ageLabel}
        </span>

        {/* 핀 아이콘 */}
        <div className="shrink-0 w-7 h-7 md:w-9 md:h-9 grid place-items-center">
          <Image
            src={pinSrc}
            alt={`${pinKind} 핀`}
            width={24}
            height={32}
            priority
          />
        </div>

        {/* 평점 */}
        <span className="hidden md:flex shrink-0 text-[20px] font-semibold text-gray-800">
          매물평점
        </span>
        <div className="shrink-0 w-[120px] md:w-[200px] leading-none">
          <div className="hidden md:flex items-center">
            <StarsRating value={rating} className="leading-none antialiased" />
          </div>
          <div className="flex md:hidden items-center">
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

        {/* 구분선 */}
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
      </div>
    </header>
  );
}
