declare namespace kakao {
  namespace maps {
    // ───────────── 기본 값 객체 ─────────────
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class Size {
      constructor(width: number, height: number);
      getWidth(): number;
      getHeight(): number;
    }

    class Point {
      constructor(x: number, y: number);
      getX(): number;
      getY(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(latlng: LatLng): void;
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
      contain(latlng: LatLng): boolean;
    }

    interface LatLngBounds {
      getSouthWest(): kakao.maps.LatLng;
      getNorthEast(): kakao.maps.LatLng;
    }

    class MarkerImage {
      constructor(src: string, size: Size, opts?: { offset?: Point });
    }

    // ───────────── 지도 ─────────────
    interface MapOptions {
      center?: LatLng;
      level?: number; // 작을수록 더 확대
    }

    /** autoload=false 로 로드했을 때 초기화 콜백 */
    function load(callback: () => void): void;

    class Map {
      constructor(container: HTMLElement, options?: MapOptions);

      // 레이아웃/투영
      relayout(): void;
      getProjection(): any;

      // 중심좌표
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      panTo(latlng: LatLng): void;

      // 확대/축소
      setLevel(level: number, opts?: { anchor?: LatLng }): void;
      getLevel(): number;
      setMaxLevel(level: number): void;

      // 경계
      setBounds(
        bounds: LatLngBounds,
        paddingTopRight?: number,
        paddingBottomLeft?: number
      ): void;
      getBounds(): LatLngBounds;
    }

    // ───────────── 마커 ─────────────
    interface MarkerOptions {
      position: LatLng;
      map?: Map | null;
      title?: string;
      image?: MarkerImage;
      zIndex?: number;
      clickable?: boolean;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setPosition(latlng: LatLng): void;
      getPosition(): LatLng;
      setTitle(title: string): void;
      setZIndex(z: number): void;
      setImage(image: MarkerImage): void;
    }

    // ───────────── 커스텀 오버레이 ─────────────
    interface CustomOverlayOptions {
      position: LatLng;
      map?: Map | null;
      content: HTMLElement | string;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
      clickable?: boolean;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
      setZIndex(z: number): void;
      getContent(): HTMLElement | string;
      setContent(content: HTMLElement | string): void;
    }

    // ───────────── (선택) 클러스터러 ─────────────
    class MarkerClusterer {
      constructor(opts: {
        map: Map;
        averageCenter?: boolean;
        minLevel?: number;
        disableClickZoom?: boolean;
      });
      addMarkers(markers: Marker[]): void;
      clear(): void;
      getCenter(): LatLng;
    }

    // ───────────── 이벤트 ─────────────
    namespace event {
      /** 카카오 SDK가 공식 타입을 제공하지 않으므로 최소 필드만 정의 */
      interface MouseEvent {
        latLng: LatLng;
        point?: Point;
        // 필요 시 필드 확장 가능
      }

      // 공통 시그니처 (fallback)
      function addListener(
        target: any,
        type: string,
        handler: (...a: any[]) => void
      ): void;
      function removeListener(
        target: any,
        type: string,
        handler: (...a: any[]) => void
      ): void;
      function trigger(target: any, type: string): void;

      // 오버로드: 자주 쓰는 이벤트에 안전한 핸들러 타입 제공
      function addListener(
        target: Map,
        type: "click",
        handler: (e: MouseEvent) => void
      ): void;
      function addListener(
        target: Map,
        type: "idle",
        handler: () => void
      ): void;
      function addListener(
        target: Map,
        type: "zoom_changed",
        handler: () => void
      ): void;
      function addListener(
        target: Map,
        type: "center_changed",
        handler: () => void
      ): void;
      function addListener(
        target: Map,
        type: "bounds_changed",
        handler: () => void
      ): void;
      function addListener(
        target: Map,
        type: "dragend",
        handler: () => void
      ): void;

      function removeListener(
        target: Map,
        type: "click",
        handler: (e: MouseEvent) => void
      ): void;
      function removeListener(
        target: Map,
        type: "idle",
        handler: () => void
      ): void;
      function removeListener(
        target: Map,
        type: "zoom_changed",
        handler: () => void
      ): void;
      function removeListener(
        target: Map,
        type: "center_changed",
        handler: () => void
      ): void;
      function removeListener(
        target: Map,
        type: "bounds_changed",
        handler: () => void
      ): void;
      function removeListener(
        target: Map,
        type: "dragend",
        handler: () => void
      ): void;
    }

    // ───────────── 서비스 ─────────────
    namespace services {
      // Status를 문자열 리터럴 유니온으로 명시
      type Status = "OK" | "ZERO_RESULT" | "ERROR";

      // Geocoder 결과 최소 필드 정의(실사용 중심)
      interface GeocoderAddress {
        address_name: string;
        x: string; // lng
        y: string; // lat
        road_address?: {
          address_name: string;
        } | null;
      }

      class Geocoder {
        addressSearch(
          q: string,
          cb: (res: GeocoderAddress[], status: Status) => void
        ): void;
        coord2Address(
          lng: number,
          lat: number,
          cb: (res: GeocoderAddress[], status: Status) => void
        ): void;
      }

      // Places 결과 최소 필드 정의(실사용 중심)
      interface Place {
        id?: string;
        place_name: string;
        x: string; // lng
        y: string; // lat
        category_group_code?: string; // 예: "SW8" (지하철역)
        category_name?: string;
        address_name?: string;
        road_address_name?: string;
      }

      type PlacesSearchCB = (res: Place[], status: Status) => void;

      class Places {
        keywordSearch(q: string, cb: PlacesSearchCB): void;
        // 필요 시 페이지/옵션 오버로드 추가 가능
      }

      // 기존 코드 호환: 객체 형태도 제공
      const Status: { OK: Status; ZERO_RESULT: Status; ERROR: Status };
    }
  }
}

export as namespace kakao;

declare global {
  const kakao: typeof kakao;
  interface Window {
    kakao: typeof kakao;
    __kakaoMapsLoadingPromise__?: Promise<void> | null;
  }
}
