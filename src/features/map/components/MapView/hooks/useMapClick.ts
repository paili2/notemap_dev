import { LatLng } from "@/lib/geo/types";
import { useEffect, useRef } from "react";
import { styleLabelEl } from "@/features/map/lib/overlays/style";
import { LABEL } from "@/features/map/lib/constants";

type Options = {
  /** 클릭 시 '신규등록위치' 임시 마커/라벨을 표시할지 여부 (기본: false) */
  showNewMarker?: boolean;
  /** 라벨 텍스트 커스터마이즈 (기본: '신규등록위치') */
  labelText?: string;
  /** 라벨 배경색 (기본: 흰색 계열) */
  labelAccentHex?: string;
  /** 클릭 후 좌표를 전달받고 싶을 때 */
  onAfterCreate?: (latlng: LatLng) => void;
};

/**
 * 지도 클릭 이벤트 훅
 * - onMapClick: 외부 콜백 (위도/경도 전달)
 * - showNewMarker: true일 때만 임시 마커/라벨 표시
 */
export function useMapClick(
  kakao: typeof window.kakao | null,
  map: kakao.maps.Map | null,
  onMapClick?: (latlng: LatLng) => void,
  {
    showNewMarker = false,
    labelText = "신규등록위치",
    labelAccentHex = "#ffffff",
    onAfterCreate,
  }: Options = {}
) {
  const tempMarkerRef = useRef<kakao.maps.Marker | null>(null as any);
  const tempLabelRef = useRef<kakao.maps.CustomOverlay | null>(null as any);

  useEffect(() => {
    if (!kakao || !map) return;

    const handler = (e: any) => {
      const latlng = e.latLng as kakao.maps.LatLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      // 외부 콜백
      onMapClick?.({ lat, lng });

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
        el.innerText = labelText;
        // 공통 라벨 스타일 적용(프로젝트 일관성 유지)
        styleLabelEl(el as HTMLDivElement, labelAccentHex, 8);

        tempLabelRef.current = new kakao.maps.CustomOverlay({
          content: el,
          position: latlng,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: LABEL.Z_INDEX,
          clickable: false,
        });
      } else {
        tempLabelRef.current.setPosition(latlng);
        // 텍스트/색 변경 가능성 대비
        const el = tempLabelRef.current.getContent() as HTMLDivElement;
        if (el && el.innerText !== labelText) el.innerText = labelText;
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
      tempMarkerRef.current = null;
      tempLabelRef.current = null;
    };
  }, [
    kakao,
    map,
    onMapClick,
    showNewMarker,
    labelText,
    labelAccentHex,
    onAfterCreate,
  ]);
}
