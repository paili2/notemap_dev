// src/features/map/view/types.ts
import type { PinKind } from "@/features/pins/types";
import type { LatLng } from "@/lib/geo/types";
import type { MapMarker } from "@/features/map/shared/types/map";
import type { PoiKind } from "@/features/map/shared/overlays/poiOverlays";

/** 뷰포트 변경 payload: 4꼭짓점 + 줌레벨 */
type MapViewportChange = {
  leftTop: LatLng;
  leftBottom: LatLng;
  rightTop: LatLng;
  rightBottom: LatLng;
  zoomLevel: number;
};

/** 검색 옵션 (useKakaoMap과 동일 인터페이스 유지) */
type SearchPlaceOptions = {
  clearPrev?: boolean;
  recenter?: boolean;
  fitZoom?: boolean;
  /** ‘…역’ 입력 시 지하철역 우선 */
  preferStation?: boolean;
  /** 기본 파란 검색핀 표시 여부(기본 true) */
  showMarker?: boolean;
  /** 검색 성공 좌표 추가 액션 */
  onFound?: (pos: LatLng) => void;
};

/** MapHomeUI에서 ref로 제어하는 퍼블릭 메서드 */
export type MapViewHandle = {
  /** 주소/키워드/역 검색 */
  searchPlace: (q: string, opts?: SearchPlaceOptions) => void;
  /** 맵을 특정 좌표로 이동 */
  panTo: (p: LatLng) => void;
};

export type MapViewProps = {
  appKey: string;
  center: LatLng;
  level?: number;

  /** 지도에 표시할 마커들 */
  markers?: MapMarker[];

  /** true면 마운트/업데이트 시 마커 bounds로 맞춤 */
  fitToMarkers?: boolean;

  /** 구/군 경계 오버레이 사용 */
  useDistrict?: boolean;

  /** 지도 클릭으로 새 핀 생성 허용 (기본 false) */
  allowCreateOnMapClick?: boolean;

  /** 개별 마커 클릭 */
  onMarkerClick?: (id: string) => void;

  /** 지도 클릭 콜백 */
  onMapClick?: (latlng: LatLng) => void;

  /** Kakao SDK/Map 준비 완료 */
  onMapReady?: (ctx: {
    map: kakao.maps.Map;
    kakao: typeof window.kakao;
  }) => void;

  /** 뷰포트 변경 시 보고 (idle 디바운스는 내부 훅에서 처리) */
  onViewportChange?: (q: MapViewportChange) => void;

  /** 라벨/핀 기본 스타일 기준이 되는 핀 종류 */
  pinKind?: PinKind;

  /** 말풍선 등으로 라벨을 숨길 대상 핀 id */
  hideLabelForId?: string | null;

  /** 드래프트 핀(“__draft__”) 클릭 시 호출 */
  onDraftPinClick?: (pos: LatLng) => void;

  /** 답사예정 핀(“__visit__*”) 클릭 시 컨텍스트 메뉴 오픈용 */
  onOpenMenu?: (args: {
    position: LatLng;
    propertyId: string;
    propertyTitle?: string | null;
    pin?: { kind: "question"; isFav?: boolean };
  }) => void;

  /** 외부 제어형 주변시설 종류 (POI 레이어) */
  poiKinds?: ReadonlyArray<PoiKind>;
  /** 내부 POI 토글 툴바 노출 여부 (기본 false) */
  showPoiToolbar?: boolean;

  /** (옵션) 탭 간 지도 동기화 채널명. 지정 시 BroadcastChannel 활성화 */
  syncChannelName?: string;
};
