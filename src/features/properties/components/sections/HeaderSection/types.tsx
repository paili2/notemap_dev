import type { PinKind } from "@/features/pins/types";

export type HeaderSectionProps = {
  /** 매물명 */
  title: string;
  setTitle: (v: string) => void;

  /** 매물평점: '1' ~ '5' 또는 '' */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

  /** 엘리베이터: null = 미선택 상태 허용 */
  elevator: "O" | "X" | null;
  setElevator: (v: "O" | "X" | null) => void;

  /** ✅ nullable: 핀 선택 전(placeholder) 상태 표현 */
  pinKind: PinKind | null;
  setPinKind: (v: PinKind | null) => void;

  /** 닫기 버튼 핸들러 */
  onClose: () => void;

  /** 매물명 placeholder 힌트 */
  placeholderHint?: string;
};
