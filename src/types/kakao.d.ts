declare namespace kakao {
  namespace maps {
    // 좌표/크기/포인트
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }
    class Size {
      constructor(width: number, height: number);
    }
    class Point {
      constructor(x: number, y: number);
    }
    class LatLngBounds {
      extend(latlng: LatLng): void;
    }
    class MarkerImage {
      constructor(src: string, size: Size, opts?: { offset?: Point });
    }

    // 지도
    interface MapOptions {
      center?: LatLng;
      level?: number;
    }
    /** autoload=false 로 로드했을 때 초기화 콜백 */
    function load(callback: () => void): void;

    class Map {
      constructor(container: HTMLElement, options?: MapOptions);
      getProjection(): any;
      relayout(): void;

      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;

      /** 확대/축소 레벨 (작을수록 더 가까움) */
      setLevel(level: number, opts?: { anchor?: LatLng }): void;
      getLevel(): number;

      /** 영역 맞추기 */
      setBounds(bounds: LatLngBounds): void;
    }

    // 마커
    interface MarkerOptions {
      position: LatLng;
      map?: Map | null;
      title?: string;
      image?: MarkerImage;
      zIndex?: number;
    }
    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
    }

    // 커스텀 오버레이
    interface CustomOverlayOptions {
      position: LatLng;
      map?: Map | null;
      content: HTMLElement | string;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
      clickable?: boolean; // 사용 중이면 포함
    }
    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
      setZIndex(z: number): void;
    }

    // (선택) 클러스터러 – 타입 필요 없으면 생략 가능
    class MarkerClusterer {
      constructor(opts: {
        map: Map;
        averageCenter?: boolean;
        minLevel?: number;
      });
      addMarkers(markers: Marker[]): void;
      clear(): void;
      getCenter(): LatLng;
    }

    // 이벤트
    namespace event {
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
    }

    // 서비스
    namespace services {
      class Geocoder {
        addressSearch(
          q: string,
          cb: (res: any[], status: string) => void
        ): void;
        coord2Address(
          lng: number,
          lat: number,
          cb: (res: any[], status: string) => void
        ): void;
      }
      class Places {
        keywordSearch(
          q: string,
          cb: (res: any[], status: string) => void
        ): void;
      }
      const Status: { OK: string };
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
