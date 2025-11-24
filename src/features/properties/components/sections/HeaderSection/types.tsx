import type { PinKind } from "@/features/pins/types";

export type HeaderSectionProps = {
  /** 매물명 */
  title: string;
  setTitle: (v: string) => void;

  /** 매물평점: '1' ~ '5' 또는 '' */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

  /** 엘리베이터: HeaderSection 기준에서는 null 없이 "O" | "X" */
  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  /** ✅ nullable: 핀 선택 전(placeholder) 상태 표현 */
  pinKind: PinKind | null;
  setPinKind: (v: PinKind) => void;

  /** 닫기 버튼 핸들러 */
  onClose: () => void;

  /** 매물명 placeholder 힌트 */
  placeholderHint?: string;
};
