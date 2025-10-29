"use client";

import type { MutableRefObject } from "react";
import { PinKind } from "@/features/pins/types";
import HeaderSectionView from "../components/HeaderSectionView/HeaderSectionView";

export type HeaderViewContainerProps = {
  /** 헤더 제목(매물명) */
  title?: string;
  /** 평점 (0~5), 미지정 허용 */
  listingStars?: number;
  /** 엘리베이터: 없으면 undefined → 헤더에서 회색 ‘-’ 로 표시 */
  elevator?: "O" | "X" | undefined;
  /** 핀 종류(없으면 컴포넌트 기본값 사용) */
  pinKind?: PinKind;
  onClose: () => void;

  /** a11y & 포커스 제어 (옵션) */
  closeButtonRef?: MutableRefObject<HTMLButtonElement | null>;
  headingId?: string;
  descId?: string;
};

export default function HeaderViewContainer({
  title,
  listingStars,
  elevator, // ← 이제 optional
  pinKind,
  onClose,
  closeButtonRef,
  headingId,
  descId,
}: HeaderViewContainerProps) {
  return (
    <HeaderSectionView
      title={title}
      listingStars={listingStars}
      elevator={elevator} // undefined 그대로 전달
      pinKind={pinKind}
      onClose={onClose}
      closeButtonRef={closeButtonRef}
      headingId={headingId}
      descId={descId}
    />
  );
}
