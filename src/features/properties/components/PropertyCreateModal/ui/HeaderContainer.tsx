"use client";
import { PinKind } from "@/features/pins/types";
import HeaderSection from "../../sections/HeaderSection/HeaderSection";

type HeaderForm = {
  title: string;
  setTitle: (v: string) => void;
  listingStars: number;
  setListingStars: (v: number) => void;
  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;
  pinKind: PinKind;
  setPinKind: (v: PinKind) => void;
};
export default function HeaderContainer({
  form,
  onClose,
}: {
  form: HeaderForm;
  onClose: () => void;
}) {
  return (
    <HeaderSection
      title={form.title}
      setTitle={form.setTitle}
      listingStars={form.listingStars}
      setListingStars={form.setListingStars}
      elevator={form.elevator}
      setElevator={form.setElevator}
      pinKind={form.pinKind}
      setPinKind={form.setPinKind}
      onClose={onClose}
    />
  );
}
