import { useEffect, useRef, useMemo, useCallback } from "react";
import { styleLabelEl } from "@/features/map/lib/overlays/style";
import { LABEL } from "@/features/map/lib/constants";
import type { LatLng } from "@/lib/geo/types";

type Options = {
  /** 클릭 시 '신규등록위치' 임시 마커/라벨 표시 (기본: false) */
  showNewMarker?: boolean;
  /** 라벨 텍스트 (기본: '신규등록위치') */
  labelText?: string;
  /** 라벨 배경색 (기본: 흰색 계열) */
  labelAccentHex?: string;
  /** 클릭 후 좌표 전달 */
  onAfterCreate?: (latlng: LatLng) => void;
};

function useStableRef<T>(v: T) {
  const r = useRef(v);
  r.current = v;
  return r;
}

/**
 * 지도 클릭 이벤트 훅
 * - onMapClick: 외부 콜백 (위도/경도 전달)
 * - showNewMarker=true 일 때 임시 마커/라벨 표시
 * - 반환값: clearTemp() 등 유틸 제공(선택 사용)
 */
export function useMapClick(
  kakao: typeof window.kakao | null,
  map: kakao.maps.Map | null,
  onMapClick?: (latlng: LatLng) => void,
  options: Options = {}
) {
  const {
    showNewMarker = false,
    labelText = "신규등록위치",
    labelAccentHex = "#ffffff",
    onAfterCreate,
  } = options;

  // 외부 콜백/옵션은 ref로 고정해 리스너 내부 stale 방지
  const onMapClickRef = useStableRef(onMapClick);
  const onAfterCreateRef = useStableRef(onAfterCreate);
  const optionsRef = useStableRef({ showNewMarker, labelText, labelAccentHex });

  const tempMarkerRef = useRef<kakao.maps.Marker | null>(null);
  const tempLabelRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const clickListenerRef = useRef<(() => void) | null>(null);

  const clearTemp = useCallback(() => {
    tempMarkerRef.current?.setMap(null);
    tempLabelRef.current?.setMap(null);
    tempMarkerRef.current = null;
    tempLabelRef.current = null;
  }, []);

  const createOrUpdateMarker = useCallback(
    (latlng: kakao.maps.LatLng) => {
      if (!kakao || !map || !optionsRef.current.showNewMarker) return;

      if (!tempMarkerRef.current) {
        tempMarkerRef.current = new kakao.maps.Marker({ position: latlng });
      } else {
        tempMarkerRef.current.setPosition(latlng);
      }
      tempMarkerRef.current?.setMap(map);
    },
    [kakao, map]
  );

  const createOrUpdateLabel = useCallback(
    (latlng: kakao.maps.LatLng) => {
      if (!kakao || !map || !optionsRef.current.showNewMarker) return;

      if (!tempLabelRef.current) {
        const el = document.createElement("div");
        el.innerText = optionsRef.current.labelText;
        styleLabelEl(
          el as HTMLDivElement,
          optionsRef.current.labelAccentHex,
          8
        );

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
        // 텍스트/색 변경 반영
        const node = tempLabelRef.current.getContent();
        // getContent는 Node를 반환할 수 있으므로 안전 캐스팅
        const el = (
          node instanceof HTMLElement ? node : null
        ) as HTMLDivElement | null;
        if (el && el.innerText !== optionsRef.current.labelText) {
          el.innerText = optionsRef.current.labelText;
        }
      }
      tempLabelRef.current?.setMap(map);
    },
    [kakao, map]
  );

  // 클릭 리스너 1회 바인딩
  useEffect(() => {
    if (!kakao || !map) return;

    const handler = (e: kakao.maps.event.MouseEvent) => {
      const latlng = e.latLng as kakao.maps.LatLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      // 외부 콜백
      onMapClickRef.current?.({ lat, lng });

      // 임시 마커/라벨
      createOrUpdateMarker(latlng);
      createOrUpdateLabel(latlng);

      // 후처리
      onAfterCreateRef.current?.({ lat, lng });
    };

    kakao.maps.event.addListener(map, "click", handler);
    clickListenerRef.current = () => {
      kakao.maps.event.removeListener(map, "click", handler);
    };

    return () => {
      clickListenerRef.current?.();
      clickListenerRef.current = null;
      clearTemp();
    };
  }, [
    kakao,
    map,
    createOrUpdateMarker,
    createOrUpdateLabel,
    clearTemp,
    onMapClickRef,
    onAfterCreateRef,
  ]);

  // 옵션이 런타임에 바뀌어도 기존 라벨에 즉시 반영되도록(선택)
  useEffect(() => {
    if (!tempLabelRef.current) return;
    const node = tempLabelRef.current.getContent();
    const el = (
      node instanceof HTMLElement ? node : null
    ) as HTMLDivElement | null;
    if (el) {
      if (el.innerText !== labelText) el.innerText = labelText;
      // 색상 변경 반영
      styleLabelEl(el, labelAccentHex, 8);
    }
  }, [labelText, labelAccentHex]);

  // 선택 사용: 외부에서 임시 요소 지우기
  return useMemo(
    () => ({
      clearTemp,
      /** 현재 임시 마커/라벨의 존재 여부 */
      hasTemp: () => !!tempMarkerRef.current || !!tempLabelRef.current,
    }),
    [clearTemp]
  );
}
