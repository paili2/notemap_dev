"use client";

import { useEffect, useRef } from "react";

type Props = {
  kakao: any;
  map: any;
  visible: boolean;
  lat?: number;
  lng?: number;
  hideLabel?: boolean; // 메뉴 열리면 라벨 숨김
};

export default function TempDraftPin({
  kakao,
  map,
  visible,
  lat,
  lng,
  hideLabel,
}: Props) {
  const markerRef = useRef<any>(null);
  const labelRef = useRef<any>(null);

  // 라벨 스타일 간단 적용
  const buildLabel = (text: string) => {
    const el = document.createElement("div");
    el.textContent = text;
    Object.assign(el.style, {
      transform: "translateY(-150%)",
      padding: "6px 10px",
      borderRadius: "8px",
      background: "#3B82F6",
      color: "#fff",
      fontWeight: "700",
      border: "1px solid rgba(0,0,0,0.12)",
      boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
      fontSize: "12px",
      lineHeight: "1",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      userSelect: "none",
    } as CSSStyleDeclaration);
    return el;
  };

  useEffect(() => {
    const cleanup = () => {
      try {
        markerRef.current?.setMap(null);
      } catch {}
      try {
        labelRef.current?.setMap(null);
      } catch {}
      markerRef.current = null;
      labelRef.current = null;
    };

    if (!kakao || !map) return cleanup();
    cleanup();

    if (!visible || typeof lat !== "number" || typeof lng !== "number") {
      return cleanup();
    }

    const pos = new kakao.maps.LatLng(lat, lng);

    // 물음표 핀 이미지 (경로는 프로젝트에 맞게)
    const image = new kakao.maps.MarkerImage(
      "/pins/question-pin.svg",
      new kakao.maps.Size(24, 34),
      { offset: new kakao.maps.Point(12, 34) }
    );

    const mk = new kakao.maps.Marker({
      position: pos,
      image,
      zIndex: 100000,
    });
    mk.setMap(map);
    markerRef.current = mk;

    // ✅ 라벨 DOM 생성
    const labelEl = buildLabel("답사예정");

    const ov = new kakao.maps.CustomOverlay({
      position: pos,
      content: labelEl,
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: 100001,
    });
    ov.setMap(hideLabel ? null : map); // 처음 표시 여부
    labelRef.current = ov;

    return cleanup;
  }, [kakao, map, visible, lat, lng, hideLabel]);

  // hideLabel만 변경될 때 라벨만 토글
  useEffect(() => {
    const ov = labelRef.current;
    if (!ov) return;
    try {
      ov.setMap(hideLabel ? null : map);
    } catch {}
  }, [hideLabel, map]);

  return null;
}
