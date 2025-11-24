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

  /** 엘리베이터 - 내부 상태는 null 허용 */
  elevator: "O" | "X" | null;
  setElevator: (v: "O" | "X" | null) => void;

  /** 핀 종류 */
  pinKind: PinKind;
  setPinKind: (v: PinKind) => void;

  /** 신축/구옥 — "new" | "old" | null(미선택) */
  buildingGrade: BuildingGrade | null;
  setBuildingGrade: Dispatch<SetStateAction<BuildingGrade | null>>;
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
        // ✅ HeaderSection은 "O" | "X"만 받으므로 null이면 기본값 "X"로 보냄
        elevator={form.elevator ?? "X"}
        // ✅ HeaderSection 타입에 맞게 래핑: (v: "O" | "X") => ...
        setElevator={(v) => form.setElevator(v)}
        pinKind={form.pinKind}
        setPinKind={form.setPinKind}
        // ✅ 신축/구옥은 null 허용이라 그대로 전달 (HeaderSection에서 어댑터 처리)
        buildingGrade={form.buildingGrade}
        setBuildingGrade={form.setBuildingGrade}
        onClose={onClose}
      />
    </div>
  );
}
