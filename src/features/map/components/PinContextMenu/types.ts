import { LatLng } from "@/lib/geo/types";
import type { PinItem } from "@/features/pins/types"; // ✅ PinItem으로 업그레이드

/** 컨텍스트 메뉴가 붙을 수 있는 대상(마커, LatLng 객체, 리터럴 좌표) */
export type PinTarget = kakao.maps.Marker | kakao.maps.LatLng | LatLng;

/** 컨텍스트 메뉴에서 '답사예약지 등록(onPlan)'으로 전달할 페이로드 */
export type PlanRequestPayload = {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;

  /**
   * 대표 주소 (우선순위: 도로명 > 지번 > 매물명 > "lat,lng")
   * - 저장은 address/date 분리 권장, 표시 시 결합 추천: "주소 · YYYY-MM-DD(요일)"
   */
  address: string;

  /** 세부 주소(옵션) */
  roadAddress?: string | null;
  jibunAddress?: string | null;

  /** 매물 식별 정보(옵션) */
  propertyId?: "__draft__" | string | null;
  propertyTitle?: string | null;

  dateISO?: string;
};

export type PinContextMenuProps = {
  /** Kakao SDK 객체 (맵 준비 전까지 null) */
  kakao: typeof window.kakao | null;
  /** 지도 인스턴스 (맵 준비 전까지 null) */
  map: kakao.maps.Map | null;

  /** 컨텍스트 메뉴가 뜰 기준 위치/대상 */
  position: PinTarget;

  /** 도로명 주소 / 지번 주소 (옵션) */
  roadAddress?: string | null;
  jibunAddress?: string | null;

  /**
   * "__draft__" 이면 신규 등록 가능한 빈 위치,
   * 그 외에는 실제 매물 ID
   */
  propertyId?: "__draft__" | string | null;

  /** 매물명(선택) — 있으면 헤더에 표시 */
  propertyTitle?: string | null;

  /** ✅ 업그레이드: 최소 타입 → PinItem */
  pin?: PinItem;

  /** 즐겨찾기 */
  onAddFav: () => void;

  /** 닫기 / 상세 보기 / 신규 등록 동작 */
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;

  /**
   * ✅ '답사예약지 등록' 액션
   * - 좌표만이 아니라 주소/메타까지 함께 전달
   */
  onPlan?: (payload: PlanRequestPayload) => void;

  /** 오버레이 z-index (기본 10000) */
  zIndex?: number;
};

/** 커스텀 오버레이 위치 계산 결과 */
export type OverlayPoint = { left: number; top: number } | null;
