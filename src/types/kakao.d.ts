export {};

declare namespace kakao {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    interface Point {
      x: number;
      y: number;
    }

    interface Projection {
      containerPointFromCoords?(latlng: LatLng): Point;
      pointFromCoords(latlng: LatLng): Point;
    }

    class Map {
      getProjection(): Projection;
      relayout(): void;
    }

    namespace event {
      function addListener(
        target: any,
        type: string,
        handler: (...a: any[]) => void
      ): any;
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
  const kakao: typeof kakao; // 전역 네임스페이스 값
  interface Window {
    kakao: typeof kakao;
    __kakaoMapsLoadingPromise__?: Promise<void> | null;
  }
}
