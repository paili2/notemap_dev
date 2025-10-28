"use client";

import type { MutableRefObject } from "react";
import { PinKind } from "@/features/pins/types";
import HeaderSectionView from "../components/HeaderSectionView/HeaderSectionView";

export type HeaderViewContainerProps = {
  title: string;
  listingStars: number;
  elevator: "O" | "X";
  pinKind: PinKind;
  onClose: () => void;

  /** a11y & 포커스 제어 (옵션) */
  closeButtonRef?: MutableRefObject<HTMLButtonElement | null>;
  headingId?: string;
  descId?: string;
};

export default function HeaderViewContainer({
  title,
  listingStars,
  elevator,
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
      elevator={elevator}
      pinKind={pinKind}
      onClose={onClose}
      closeButtonRef={closeButtonRef}
      headingId={headingId}
      descId={descId}
    />
  );
}
