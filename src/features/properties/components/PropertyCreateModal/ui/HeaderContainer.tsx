"use client";

import type { Dispatch, SetStateAction } from "react";
import { PinKind } from "@/features/pins/types";
import HeaderSection from "../../sections/HeaderSection/HeaderSection";
import { BuildingGrade } from "@/features/properties/types/building-grade";

type HeaderForm = {
  title: string;
  setTitle: (v: string) => void;

  /** 매물평점: '1' ~ '5' 또는 '' */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

  /** 엘리베이터 */
  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  /** 핀 종류 */
  pinKind: PinKind;
  setPinKind: (v: PinKind) => void;

  /** 신축/구옥 — 기본값 신축, 미선택 없음 */
  buildingGrade: BuildingGrade; // "new" | "old"
  setBuildingGrade: Dispatch<SetStateAction<BuildingGrade>>;
};

export default function HeaderContainer({
  form,
  onClose,
}: {
  form: HeaderForm;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-[1002] bg-white">
      <HeaderSection
        title={form.title}
        setTitle={form.setTitle}
        parkingGrade={form.parkingGrade}
        setParkingGrade={form.setParkingGrade}
        elevator={form.elevator}
        setElevator={form.setElevator}
        pinKind={form.pinKind}
        setPinKind={form.setPinKind}
        buildingGrade={form.buildingGrade}
        setBuildingGrade={form.setBuildingGrade}
        onClose={onClose}
      />
    </div>
  );
}
