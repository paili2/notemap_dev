import { PinKind } from "@/features/map/pins";

export interface HeaderSectionViewProps {
  title: string;
  listingStars: number;
  elevator: "O" | "X";
  /** 👇 현재 보여지는 핀 종류 추가 */
  pinKind?: PinKind;
  onClose?: () => void;
}
