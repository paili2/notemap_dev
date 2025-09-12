import { LatLng } from "@/lib/geo/types";

// 지도 컨텍스트 메뉴가 붙을 수 있는 대상(마커, LatLng 객체, 리터럴 좌표)
export type PinTarget = kakao.maps.Marker | kakao.maps.LatLng | LatLng;

export type PinContextMenuProps = {
  /** Kakao SDK 객체 (맵 준비 전까지 null) */
  kakao: typeof window.kakao | null;
  /** 지도 인스턴스 (맵 준비 전까지 null) */
  map: kakao.maps.Map | null;

  /** 컨텍스트 메뉴가 뜰 기준 위치/대상 */
  position: PinTarget;

  /** 도로명 주소 / 지번 주소 */
  roadAddress?: string | null;
  jibunAddress?: string | null;

  /** "__draft__" 이면 신규 등록 가능한 빈 위치, 그 외에는 실제 매물 ID */
  propertyId?: "__draft__" | string | null;
  /** 매물명(선택) — 있으면 헤더에 표시 */
  propertyTitle?: string | null;

  /** 닫기 / 상세 보기 / 신규 등록 동작 */
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;

  /** 오버레이 z-index (기본 10000) */
  zIndex?: number;
};

export type OverlayPoint = { left: number; top: number } | null;
