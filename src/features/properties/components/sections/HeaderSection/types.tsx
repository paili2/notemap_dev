import { PinKind } from "@/features/pins/types";

export type BuildingGrade = "new" | "old" | null;

export type HeaderSectionProps = {
  title: string;
  setTitle: (v: string) => void;

  /** '1'~'5' 또는 '' */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  /** ✅ nullable: 핀 선택 전(placeholder) 상태를 표현 */
  pinKind: PinKind | null;
  setPinKind: (v: PinKind) => void;

  /** ✅ 신축/구옥 토글 (미선택 null) */
  buildingGrade: BuildingGrade;
  setBuildingGrade?: (v: BuildingGrade) => void;

  onClose: () => void;
  placeholderHint?: string;
};
