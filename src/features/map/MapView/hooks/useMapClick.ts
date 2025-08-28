import { useEffect, useRef } from "react";

type LatLng = { lat: number; lng: number };

type Options = {
  /** 클릭 시 '신규등록위치' 임시 마커/라벨을 표시할지 여부 (기본: false) */
  showNewMarker?: boolean;
  /** 클릭 후 좌표를 전달받고 싶을 때 */
  onAfterCreate?: (latlng: LatLng) => void;
};

/**
 * 지도 클릭 이벤트 훅
 * - onMapClick: 외부 콜백 (위도/경도 전달)
 * - showNewMarker: true일 때만 임시 마커/라벨("신규등록위치") 표시
 */
export function useMapClick(
  kakao: any,
  map: any,
  onMapClick?: (latlng: LatLng) => void,
  { showNewMarker = false, onAfterCreate }: Options = {}
) {
  const tempMarkerRef = useRef<any>(null);
  const tempLabelRef = useRef<any>(null);

  useEffect(() => {
    if (!kakao || !map) return;

    const handler = (e: any) => {
      const latlng = e.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      // 외부 콜백 실행
      onMapClick?.({ lat, lng });

      // 🔕 기본은 신규등록 마커/라벨을 만들지 않음
      if (!showNewMarker) return;

      // ---- 임시 마커 ----
      if (!tempMarkerRef.current) {
        tempMarkerRef.current = new kakao.maps.Marker({ position: latlng });
      } else {
        tempMarkerRef.current.setPosition(latlng);
      }
      tempMarkerRef.current.setMap(map);

      // ---- 임시 라벨 ----
      if (!tempLabelRef.current) {
        const el = document.createElement("div");
        el.innerText = "신규등록위치";
        Object.assign(el.style, {
          transform: "translate(-50%, -120%)",
          background: "white",
          padding: "4px 8px",
          borderRadius: "6px",
          border: "1px solid rgba(0,0,0,0.12)",
          fontSize: "12px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        } as CSSStyleDeclaration);

        tempLabelRef.current = new kakao.maps.CustomOverlay({
          content: el,
          position: latlng,
          yAnchor: 1,
          zIndex: 10000,
        });
      } else {
        tempLabelRef.current.setPosition(latlng);
      }
      tempLabelRef.current.setMap(map);

      // 후처리 콜백
      onAfterCreate?.({ lat, lng });
    };

    kakao.maps.event.addListener(map, "click", handler);

    return () => {
      kakao.maps.event.removeListener(map, "click", handler);
      tempMarkerRef.current?.setMap(null);
      tempLabelRef.current?.setMap(null);
    };
  }, [kakao, map, onMapClick, showNewMarker, onAfterCreate]);
}
