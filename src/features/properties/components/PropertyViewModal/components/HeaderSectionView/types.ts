import type { MutableRefObject } from "react";
import { PinKind } from "@/features/pins/types";

export interface HeaderSectionViewProps {
  /** 매물명 */
  title?: string;

  /** ✅ 매물평점 (서버 parkingGrade를 문자열 또는 숫자 형태로 수용) */
  parkingGrade?: string | number;

  /** 엘리베이터 유무 — 값 없으면 undefined (→ "-"로 표시) */
  elevator?: "O" | "X" | undefined;

  /** 현재 보여지는 핀 종류 */
  pinKind?: PinKind;

  /** 닫기 핸들러 */
  onClose?: () => void;

  /** 접근성 및 포커스 제어용 */
  closeButtonRef?: MutableRefObject<HTMLButtonElement | null>;

  /** 모달 접근성 연계를 위한 heading id */
  headingId?: string;

  /** 보조 설명(SR-only) 연결용 id */
  descId?: string;
}
