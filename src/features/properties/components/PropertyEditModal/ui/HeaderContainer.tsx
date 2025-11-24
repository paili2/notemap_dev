"use client";

import { BuildingGrade } from "@/features/properties/types/building-grade";
import HeaderSection from "../../sections/HeaderSection/HeaderSection";
import type { PinKind } from "../hooks/useEditForm/types";

/** 최신 버전 폼 타입 */
export type HeaderForm = {
  title: string;
  setTitle: (v: string) => void;

  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  /** 핀선택: placeholder를 쓰기 위해 null 허용 */
  pinKind: PinKind | null;
  setPinKind: (v: PinKind | null) => void;

  /** 신축/구옥 */
  buildingGrade: BuildingGrade | null;
  setBuildingGrade: (v: BuildingGrade | null) => void;
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
      pinKind={form.pinKind} // 🔥 여기!
      setPinKind={form.setPinKind} // 🔥 null 허용 함수
      buildingGrade={form.buildingGrade}
      setBuildingGrade={form.setBuildingGrade}
    />
  );
}
