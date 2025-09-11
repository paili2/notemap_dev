"use client";

import { PinKind } from "@/features/pins/types";
import HeaderSectionView from "../components/HeaderSectionView/HeaderSectionView";

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
