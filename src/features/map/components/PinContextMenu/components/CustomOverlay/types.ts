"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

export type CustomOverlayProps = {
  kakao: typeof window.kakao | null;
  map: kakao.maps.Map | null;
  position: kakao.maps.LatLng;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
  className?: string;
  /** 오버레이 내부 포인터 이벤트 허용 여부 (기본 true) */
  pointerEventsEnabled?: boolean;
  children: React.ReactNode;
};

export type CustomOverlayHandle = {
  getOverlay: () => kakao.maps.CustomOverlay | null;
  setPosition: (pos: kakao.maps.LatLng) => void;
  setZIndex: (z: number) => void;
  show: () => void;
  hide: () => void;
};

const CustomOverlay = forwardRef<CustomOverlayHandle, CustomOverlayProps>(
  (
    {
      kakao,
      map,
      position,
      xAnchor = 0.5,
      yAnchor = 1,
      zIndex = 10_000,
      className,
      pointerEventsEnabled = true,
      children,
    },
    ref
  ) => {
    // Overlay content container (1회 생성)
    const containerRef = useRef<HTMLDivElement | null>(null);
    if (!containerRef.current && typeof document !== "undefined") {
      containerRef.current = document.createElement("div");
    }

    // Kakao CustomOverlay instance
    const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

    // pointer-events 계산
    const pointerEvents = useMemo(
      () => (pointerEventsEnabled ? "auto" : "none"),
      [pointerEventsEnabled]
    );

    // container 클래스/스타일 반영
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.style.pointerEvents = pointerEvents;
      if (className) el.className = className;
    }, [className, pointerEvents]);

    // overlay 생성/파괴 (xAnchor/yAnchor가 바뀔 때만 재생성)
    useEffect(() => {
      if (!kakao || !map || !containerRef.current) return;

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: containerRef.current,
        xAnchor,
        yAnchor,
        zIndex,
        clickable: pointerEventsEnabled, // 클릭 통과 제어가 필요한 경우
      });

      overlayRef.current = overlay;
      overlay.setMap(map);

      return () => {
        try {
          overlay.setMap(null);
        } catch {}
        overlayRef.current = null;
      };
    }, [kakao, map, xAnchor, yAnchor]); // 재생성 트리거

    // 위치 변화 반영
    useEffect(() => {
      overlayRef.current?.setPosition(position);
    }, [position]);

    // zIndex 변화 반영
    useEffect(() => {
      overlayRef.current?.setZIndex(zIndex ?? 10_000);
    }, [zIndex]);

    // imperative handle
    useImperativeHandle(
      ref,
      (): CustomOverlayHandle => ({
        getOverlay: () => overlayRef.current,
        setPosition: (pos) => overlayRef.current?.setPosition(pos),
        setZIndex: (z) => overlayRef.current?.setZIndex(z),
        show: () => {
          if (!overlayRef.current || !map) return;
          overlayRef.current.setMap(map);
        },
        hide: () => overlayRef.current?.setMap(null),
      }),
      [map]
    );

    if (!containerRef.current) return null;
    return createPortal(children, containerRef.current);
  }
);

CustomOverlay.displayName = "CustomOverlay";
export default CustomOverlay;
