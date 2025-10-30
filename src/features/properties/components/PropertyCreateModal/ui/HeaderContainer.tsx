"use client";

import { PinKind } from "@/features/pins/types";
import HeaderSection from "../../sections/HeaderSection/HeaderSection";

type HeaderForm = {
  title: string;
  setTitle: (v: string) => void;

  /** ⭐ 매물평점: 문자열 '1'~'5' 또는 '' */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

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
      parkingGrade={form.parkingGrade}
      setParkingGrade={form.setParkingGrade}
      elevator={form.elevator}
      setElevator={form.setElevator}
      pinKind={form.pinKind}
      setPinKind={form.setPinKind}
      onClose={onClose}
    />
  );
}
