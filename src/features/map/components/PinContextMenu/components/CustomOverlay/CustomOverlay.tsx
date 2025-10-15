"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

export type CustomOverlayHandle = {
  getOverlay: () => kakao.maps.CustomOverlay | null;
  setPosition: (pos: kakao.maps.LatLng) => void;
  setZIndex: (z: number) => void;
  show: () => void;
  hide: () => void;
};

export type CustomOverlayProps = {
  kakao: typeof window.kakao | null;
  map: kakao.maps.Map | null;
  position: kakao.maps.LatLng;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
  className?: string;

  /** 새 이름(권장) */
  pointerEventsEnabled?: boolean;
  /** 구 이름(과거 호환) */
  enablePointerEvents?: boolean;

  children: React.ReactNode;
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
      // 둘 다 받되 priority는 새 이름 → 구 이름 → 기본 true
      pointerEventsEnabled,
      enablePointerEvents,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    if (!containerRef.current && typeof document !== "undefined") {
      containerRef.current = document.createElement("div");
    }

    const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

    const peEnabled = pointerEventsEnabled ?? enablePointerEvents ?? true;
    const pointerEvents = useMemo(
      () => (peEnabled ? "auto" : "none"),
      [peEnabled]
    );

    // container 스타일/클래스
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.style.pointerEvents = pointerEvents;
      if (className) el.className = className;
    }, [className, pointerEvents]);

    // overlay 생성/파괴 (anchor 변경에만 재생성)
    useEffect(() => {
      if (!kakao || !map || !containerRef.current) return;

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: containerRef.current,
        xAnchor,
        yAnchor,
        zIndex,
        clickable: peEnabled, // pointer-events와 일치시킴
      });

      overlayRef.current = overlay;
      overlay.setMap(map);

      return () => {
        try {
          overlay.setMap(null);
        } catch {}
        overlayRef.current = null;
      };
    }, [kakao, map, xAnchor, yAnchor, peEnabled]);

    // 위치/층위 반영
    useEffect(() => {
      overlayRef.current?.setPosition(position);
    }, [position]);
    useEffect(() => {
      overlayRef.current?.setZIndex(zIndex ?? 10_000);
    }, [zIndex]);

    useImperativeHandle(
      ref,
      () => ({
        getOverlay: () => overlayRef.current,
        setPosition: (pos) => overlayRef.current?.setPosition(pos),
        setZIndex: (z) => overlayRef.current?.setZIndex(z),
        show: () => overlayRef.current && map && overlayRef.current.setMap(map),
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
