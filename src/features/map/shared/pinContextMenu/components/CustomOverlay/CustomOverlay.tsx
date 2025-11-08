"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

type CustomOverlayHandle = {
  getOverlay: () => kakao.maps.CustomOverlay | null;
  setPosition: (pos: kakao.maps.LatLng) => void;
  setZIndex: (z: number) => void;
  show: () => void;
  hide: () => void;
};

type CustomOverlayProps = {
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
    // ✅ lazy initializer: StrictMode 이중 렌더시에도 동일 객체 유지
    const containerRef = useRef<HTMLDivElement | null>(
      typeof document !== "undefined" ? document.createElement("div") : null
    );
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
      // className 없으면 비우기(이전 클래스 잔존 방지)
      el.className = className ?? "";
    }, [className, pointerEvents]);

    // overlay 생성/파괴 (anchor 변경/클릭 차단 플래그 변경 시 재생성)
    useEffect(() => {
      if (!kakao || !map || !containerRef.current) return;

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: containerRef.current,
        xAnchor,
        yAnchor,
        zIndex,
        clickable: peEnabled, // pointer-events와 동기화
      });

      overlayRef.current = overlay;
      overlay.setMap(map);

      return () => {
        try {
          overlay.setMap(null);
        } catch {}
        overlayRef.current = null;
      };
      // position은 아래 별도 effect로 setPosition 하므로 의존성에서 제외
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
