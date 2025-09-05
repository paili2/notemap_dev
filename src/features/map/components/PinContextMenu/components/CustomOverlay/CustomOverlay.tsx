"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  kakao: typeof kakao;
  map: kakao.maps.Map;
  position: kakao.maps.LatLng;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
  className?: string;
  children: React.ReactNode;
};

export default function CustomOverlay({
  kakao,
  map,
  position,
  xAnchor = 0.5,
  yAnchor = 1.1,
  zIndex = 10000,
  className,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

  // 최초 1회 컨테이너 DOM 생성
  if (!containerRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    if (className) el.className = className;
    // 지도 클릭으로 전파되지 않도록 기본적으로 포인터 허용
    el.style.pointerEvents = "auto";
    containerRef.current = el;
  }

  // 오버레이 생성 / 제거
  useEffect(() => {
    if (!containerRef.current) return;

    const ov = new kakao.maps.CustomOverlay({
      position,
      content: containerRef.current,
      xAnchor,
      yAnchor,
      zIndex,
      clickable: true, // ✅ 내부 클릭이 지도에 전파되지 않도록 처리
    });

    ov.setMap(map);
    overlayRef.current = ov;

    return () => {
      ov.setMap(null);
      overlayRef.current = null;
    };
  }, [map, position, xAnchor, yAnchor, zIndex]);

  // 위치 / zIndex 업데이트
  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setPosition(position);
    overlayRef.current.setZIndex(zIndex);
  }, [position, zIndex]);

  // ✅ 오버레이 내부 이벤트가 지도까지 전파되지 않도록 방지
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stop = (e: Event) => {
      e.stopPropagation();
    };
    const stopAndPrevent = (e: Event) => {
      e.stopPropagation();
      // 드래그/줌 제스처가 지도에 먹지 않도록 예방
      if (
        e.type === "touchstart" ||
        e.type === "pointerdown" ||
        e.type === "wheel"
      ) {
        e.preventDefault?.();
      }
    };

    el.addEventListener("click", stop);
    el.addEventListener("dblclick", stop);
    el.addEventListener("contextmenu", stop);
    el.addEventListener("mousedown", stopAndPrevent as any);
    el.addEventListener("mouseup", stop);
    el.addEventListener("touchstart", stopAndPrevent as any, {
      passive: false,
    });
    el.addEventListener("touchend", stop);
    el.addEventListener("pointerdown", stopAndPrevent as any);
    el.addEventListener("pointerup", stop);
    el.addEventListener("wheel", stopAndPrevent as any, { passive: false });

    return () => {
      el.removeEventListener("click", stop);
      el.removeEventListener("dblclick", stop);
      el.removeEventListener("contextmenu", stop);
      el.removeEventListener("mousedown", stopAndPrevent as any);
      el.removeEventListener("mouseup", stop);
      el.removeEventListener("touchstart", stopAndPrevent as any);
      el.removeEventListener("touchend", stop);
      el.removeEventListener("pointerdown", stopAndPrevent as any);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("wheel", stopAndPrevent as any);
    };
  }, []);

  if (!containerRef.current) return null;
  return createPortal(children, containerRef.current);
}
