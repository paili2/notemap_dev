import { PinKind } from "@/features/pins/types";

export type HeaderSectionProps = {
  title: string;
  setTitle: (v: string) => void;

  /** '1'~'5' 또는 '' */
  parkingGrade: "" | "1" | "2" | "3" | "4" | "5";
  setParkingGrade: (v: "" | "1" | "2" | "3" | "4" | "5") => void;

  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  pinKind: PinKind;
  setPinKind: (v: PinKind) => void;

  onClose: () => void;
  placeholderHint?: string;
};
