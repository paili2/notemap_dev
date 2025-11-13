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

export default function HeaderViewContainer({
  title,
  parkingGrade,
  elevator,
  pinKind,
  closeButtonRef,
  headingId,
  descId,
  isNew,
  isOld,
  buildingAgeType,
  completionDate,
  newYearsThreshold = 5,
}: HeaderViewContainerProps) {
  // 평점만 안전하게 숫자로 정규화
  const safeGrade =
    typeof parkingGrade === "number"
      ? Math.max(0, Math.min(5, Math.round(parkingGrade)))
      : Number.isFinite(Number(parkingGrade))
      ? Math.max(0, Math.min(5, Math.round(Number(parkingGrade))))
      : undefined;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[HeaderViewContainer] → HeaderSectionView props", {
      isNew,
      isOld,
      buildingAgeType,
      completionDate,
      newYearsThreshold,
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
      isNew={isNew ?? undefined}
      isOld={isOld ?? undefined}
      buildingAgeType={buildingAgeType ?? undefined}
      completionDate={completionDate ?? null}
      newYearsThreshold={newYearsThreshold}
    />
  );
}
