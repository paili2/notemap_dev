export {};

declare global {
  namespace kakao.maps {
    /**
     * Map에 오버레이 맵 타입 제어 메서드가 실제로 존재하지만
     * 기본 d.ts에 누락된 경우가 있어 보강합니다.
     */
    interface Map {
      addOverlayMapTypeId(id: any): void;
      removeOverlayMapTypeId(id: any): void;
    }

    /**
     * 런타임에 존재하는 MapTypeId 상수를 최소 키만 선언합니다.
     * (기존 선언과 충돌 없도록 '보강'만 합니다)
     */
    const MapTypeId: {
      ROADMAP?: any;
      SKYVIEW?: any;
      HYBRID?: any;
      USE_DISTRICT?: any; // 지적편집도
      TRAFFIC?: any;
      TERRAIN?: any;
    };

    /**
     * Marker/CustomOverlay의 누락 메서드 보강
     */
    interface Marker {
      /** 마커의 위치를 변경 */
      setPosition(latlng: kakao.maps.LatLng): void;
    }

    interface CustomOverlay {
      /** 오버레이의 위치를 변경 */
      setPosition(latlng: kakao.maps.LatLng): void;
      /** content 엘리먼트(또는 HTML 문자열) 반환 */
      getContent(): HTMLElement | string;
    }
  }
}
