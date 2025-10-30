// src/features/properties/components/PropertyViewModal/ui/HeaderViewContainer.tsx
"use client";

import type { MutableRefObject } from "react";
import { PinKind } from "@/features/pins/types";
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

  /** 닫기 핸들러 */
  onClose: () => void;

  /** 접근성 & 포커스 제어 (옵션) */
  closeButtonRef?: MutableRefObject<HTMLButtonElement | null>;
  headingId?: string;
  descId?: string;
};

export default function HeaderViewContainer({
  title,
  parkingGrade,
  elevator,
  pinKind,
  onClose,
  closeButtonRef,
  headingId,
  descId,
}: HeaderViewContainerProps) {
  // ⭐ 문자열/숫자 모두 안전하게 숫자화 → 0~5 범위로 보정
  const safeGrade =
    typeof parkingGrade === "number"
      ? Math.max(0, Math.min(5, Math.round(parkingGrade)))
      : Number.isFinite(Number(parkingGrade))
      ? Math.max(0, Math.min(5, Math.round(Number(parkingGrade))))
      : undefined;

  return (
    <HeaderSectionView
      title={title}
      parkingGrade={safeGrade}
      elevator={elevator}
      pinKind={pinKind}
      onClose={onClose}
      closeButtonRef={closeButtonRef}
      headingId={headingId}
      descId={descId}
    />
  );
}
