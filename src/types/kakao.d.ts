declare namespace kakao {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }
    interface MapOptions {
      center?: LatLng;
      level?: number;
    }
    class Map {
      constructor(container: HTMLElement, options?: MapOptions);
      getProjection(): any;
      relayout(): void;
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
    }
    interface MarkerOptions {
      position: LatLng;
      map?: Map | null;
    }
    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
    }
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
    }
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
