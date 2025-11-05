"use client";

import HeaderSection from "../../sections/HeaderSection/HeaderSection";
import type { PinKind } from "../hooks/useEditForm/types";

/** 최신 버전 폼 타입 */
type HeaderForm = {
  title: string;
  setTitle: (v: string) => void;

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
      onClose={onClose}
      pinKind={form.pinKind}
      setPinKind={form.setPinKind}
    />
  );
}
