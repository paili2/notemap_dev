import type { MutableRefObject } from "react";
import type { PinKind } from "@/features/pins/types";

export interface HeaderSectionViewProps {
  /** 매물명 */
  title?: string;

  /** ✅ 매물평점 (서버 parkingGrade를 문자열 또는 숫자 형태로 수용) */
  parkingGrade?: "" | "1" | "2" | "3" | "4" | "5" | number;

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

  // ====== ⬇️ 신축/구옥 표기를 위한 조회 전용 필드들 ======
  /** 서버에서 신축 여부(Boolean) — 있으면 그대로 표시 */
  isNew?: boolean | null;

  /** 서버에서 구옥 여부(Boolean) — 있으면 그대로 표시 */
  isOld?: boolean | null;

  /** 서버가 문자열로 제공할 때 대비: "NEW" | "OLD" | "" */
  buildingAgeType?: "NEW" | "OLD" | "" | null;

  /** 완공일(서버 값). isNew/isOld 없을 때 보정용 */
  completionDate?: string | Date | null;

  /** 완공일 보정 기준(최근 N년 이내면 신축으로 간주). 기본 5 */
  newYearsThreshold?: number;

  /** 리베이트 텍스트(만원 단위, 서버 rebateText) */
  rebateText?: string | number | null;
}
