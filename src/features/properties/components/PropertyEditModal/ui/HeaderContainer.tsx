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
  setPinKind: (v: PinKind) => void;

  /** 신축/구옥 - ✅ HeaderSection의 정의(널 허용)와 동일하게 맞춘다 */
  buildingGrade: BuildingGrade; // "new" | "old" | null (HeaderSection 기준)
  setBuildingGrade: (v: BuildingGrade) => void; // (null까지 받도록)
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
      // 핀 선택 (기존 그대로)
      pinKind={(form.pinKind ?? undefined) as unknown as PinKind}
      setPinKind={form.setPinKind}
      // ✅ 신축/구옥 - 타입 맞춘 그대로 전달
      buildingGrade={form.buildingGrade}
      setBuildingGrade={form.setBuildingGrade}
    />
  );
}
