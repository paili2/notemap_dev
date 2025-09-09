"use client";

import HeaderSectionView from "../components/HeaderSectionView/HeaderSectionView";
import type { PinKind } from "@/features/map/pins"; // ✅ 추가

export default function HeaderViewContainer({
  title,
  listingStars,
  elevator,
  pinKind,
  onClose,
}: {
  title: string;
  listingStars: number;
  elevator: "O" | "X";
  pinKind: PinKind;
  onClose: () => void;
}) {
  return (
    <HeaderSectionView
      title={title}
      listingStars={listingStars}
      elevator={elevator}
      pinKind={pinKind}
      onClose={onClose}
    />
  );
}
