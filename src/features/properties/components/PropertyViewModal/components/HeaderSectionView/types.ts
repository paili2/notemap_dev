import type { MutableRefObject } from "react";
import { PinKind } from "@/features/pins/types";

export interface HeaderSectionViewProps {
  title: string;
  listingStars: number;
  elevator: "O" | "X";
  /** 👇 현재 보여지는 핀 종류 */
  pinKind?: PinKind;
  /** 닫기 핸들러 */
  onClose?: () => void;

  /** ✅ 추가: 접근성 및 포커스 제어용 */
  closeButtonRef?: MutableRefObject<HTMLButtonElement | null>;
  /** ✅ 모달 접근성 연계를 위한 heading id */
  headingId?: string;
  /** ✅ 보조 설명(SR-only) 연결용 id */
  descId?: string;
}
