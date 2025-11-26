import { PropertyItem } from "../properties/types/propertyItem";

export type PinKind =
  | "1room"
  | "1room-terrace"
  | "2room"
  | "2room-terrace"
  | "3room"
  | "3room-terrace"
  | "4room"
  | "4room-terrace"
  | "duplex" // 복층
  | "duplex-terrace"
  | "townhouse" // 타운하우스
  | "question" // 답사예정
  | "completed"; // 완료

export type PinState = "draft" | "saved" | "reserved";

export type PinItem = PropertyItem & {
  kind: PinKind; // "question" = 답사예정
  state?: "draft" | "saved"; // 임시/저장됨
  isFav?: boolean;
};
