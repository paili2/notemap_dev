"use client";

import type { MutableRefObject } from "react";
import type { PinKind } from "@/features/pins/types";
import HeaderSectionView from "../components/HeaderSectionView/HeaderSectionView";

export type HeaderViewContainerProps = {
  /** 헤더 제목(매물명) */
  title?: string;

  /** ✅ 매물평점 (서버 parkingGrade — 문자열 또는 숫자) */
  parkingGrade?: string | number;

  /** 엘리베이터: 없으면 undefined → 헤더에서 회색 ‘-’ 표시 */
  elevator?: "O" | "X" | undefined;

  /** 핀 종류(없으면 컴포넌트 기본값 사용) */
  pinKind?: PinKind;

  /** 접근성 & 포커스 제어 (옵션) */
  closeButtonRef?: MutableRefObject<HTMLButtonElement | null>;
  headingId?: string;
  descId?: string;

  // ====== ⬇️ 신축/구옥 표기를 위한 조회 전용 필드들 ======
  /** 서버에서 신축 여부(Boolean) — 있으면 그대로 표시 */
  isNew?: boolean | null;

  /** 서버에서 구옥 여부(Boolean) — 있으면 그대로 표시 */
  isOld?: boolean | null;

  /** 서버가 문자열로 제공할 때 대비: "NEW" | "OLD" | "" */
  buildingAgeType?: "NEW" | "OLD" | "" | null;

  /** 완공일(서버 값). isNew/isOld 없을 때 보정용 */
  completionDate?: string | Date | null;

  /** 완공일 보정 기준(최근 N년 이내면 신축으로 간주). 기본 5 */
  newYearsThreshold?: number;
};

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

/* ───────────── 유틸: buildingAgeType → 불리언 ───────────── */
function fromBuildingAgeType(t: "NEW" | "OLD" | "" | null | undefined): {
  isNew: boolean | null;
  isOld: boolean | null;
} {
  if (t === "NEW") return { isNew: true, isOld: false };
  if (t === "OLD") return { isNew: false, isOld: true };
  return { isNew: null, isOld: null };
}

/* ───────────── 유틸: 완공일 기준 보정 ─────────────
   최근 N년 이내면 신축(true), 그 외는 구옥(true)로 보정.
   (서버 정책에 맞게 조정 가능: 여기서는 단순히 이분법 적용)
*/
function fromCompletionDate(
  completionDate: string | Date | null | undefined,
  thresholdYears: number
): { isNew: boolean | null; isOld: boolean | null } {
  if (!completionDate) return { isNew: null, isOld: null };
  const d =
    completionDate instanceof Date
      ? completionDate
      : new Date(String(completionDate));
  if (isNaN(d.getTime())) return { isNew: null, isOld: null };

  const now = new Date();
  const years = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (years <= thresholdYears) return { isNew: true, isOld: false };
  return { isNew: false, isOld: true };
}

/* ───────────── 최종 플래그 결정(우선순위) ─────────────
   1) 명시 isNew/isOld (문자열/숫자 포함 정규화)
   2) buildingAgeType ("NEW"/"OLD")
   3) completionDate (threshold 보정)
   결과적으로 신축/구옥 중 하나만 true가 되게 정리
*/
function resolveAgeFlags(opts: {
  isNewRaw?: boolean | null;
  isOldRaw?: boolean | null;
  buildingAgeType?: "NEW" | "OLD" | "" | null;
  completionDate?: string | Date | null;
  newYearsThreshold: number;
}): { isNew: boolean | null; isOld: boolean | null } {
  const nIsNew = normalizeBool(opts.isNewRaw);
  const nIsOld = normalizeBool(opts.isOldRaw);

  // 1) 명시 불리언 우선
  if (nIsNew === true) return { isNew: true, isOld: false };
  if (nIsOld === true) return { isNew: false, isOld: true };
  if (nIsNew === false && nIsOld === false) return { isNew: null, isOld: null };

  // 2) 타입 문자열
  const byType = fromBuildingAgeType(opts.buildingAgeType);
  if (byType.isNew !== null || byType.isOld !== null) return byType;

  // 3) 완공일 기반 보정
  const byDate = fromCompletionDate(
    opts.completionDate,
    opts.newYearsThreshold
  );
  if (byDate.isNew !== null || byDate.isOld !== null) return byDate;

  // 아무 것도 없으면 판단 보류
  return { isNew: null, isOld: null };
}

export default function HeaderViewContainer({
  title,
  parkingGrade,
  elevator,
  pinKind,
  closeButtonRef,
  headingId,
  descId,

  // ⬇️ 추가 전달 필드
  isNew,
  isOld,
  buildingAgeType,
  completionDate,
  newYearsThreshold = 5,
}: HeaderViewContainerProps) {
  // ⭐ 문자열/숫자 모두 안전하게 숫자화 → 0~5 범위로 보정
  const safeGrade =
    typeof parkingGrade === "number"
      ? Math.max(0, Math.min(5, Math.round(parkingGrade)))
      : Number.isFinite(Number(parkingGrade))
      ? Math.max(0, Math.min(5, Math.round(Number(parkingGrade))))
      : undefined;

  // 🧠 신축/구옥 최종 결정 (우선순위 적용)
  const { isNew: finalIsNew, isOld: finalIsOld } = resolveAgeFlags({
    isNewRaw: isNew,
    isOldRaw: isOld,
    buildingAgeType,
    completionDate,
    newYearsThreshold,
  });

  // 디버그: 실제 흐름 확인
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[HeaderViewContainer] age flags", {
      input: {
        isNew,
        isOld,
        buildingAgeType,
        completionDate,
        newYearsThreshold,
      },
      normalized: { finalIsNew, finalIsOld },
    });
  }

  return (
    <HeaderSectionView
      title={title}
      parkingGrade={safeGrade}
      elevator={elevator}
      pinKind={pinKind}
      closeButtonRef={closeButtonRef}
      headingId={headingId}
      descId={descId}
      isNew={finalIsNew ?? undefined}
      isOld={finalIsOld ?? undefined}
      buildingAgeType={buildingAgeType ?? undefined}
      completionDate={completionDate ?? null}
      newYearsThreshold={newYearsThreshold}
    />
  );
}
