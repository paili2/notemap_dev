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
  pointerEventsEnabled?: boolean;
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
      pointerEventsEnabled,
      enablePointerEvents,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(
      typeof document !== "undefined" ? document.createElement("div") : null
    );
    const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

    const peEnabled = pointerEventsEnabled ?? enablePointerEvents ?? true;
    const pointerEvents = useMemo(
      () => (peEnabled ? "auto" : "none"),
      [peEnabled]
    );

    // 컨테이너 스타일
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.style.pointerEvents = pointerEvents;
      el.className = className ?? "";
    }, [className, pointerEvents]);

    // overlay 생성/파괴
    useEffect(() => {
      if (!kakao || !map || !containerRef.current) return;

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: containerRef.current,
        xAnchor,
        yAnchor,
        zIndex,
        clickable: peEnabled,
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

    // 위치 변경 시 갱신 + relayout
    useEffect(() => {
      const ov = overlayRef.current;
      if (!ov) return;
      ov.setPosition(position);
      (ov as any).relayout?.();
    }, [position]);

    // zIndex 변경
    useEffect(() => {
      overlayRef.current?.setZIndex(zIndex ?? 10_000);
    }, [zIndex]);

    // 내용/크기 변화에 따른 relayout (살살)
    useEffect(() => {
      const ov = overlayRef.current;
      const el = containerRef.current;
      if (!ov || !el) return;

      let ticking = false;

      const doRelayout = () => {
        if (!ov) return;
        try {
          (ov as any).relayout?.();
        } catch {
          /* ignore */
        }
      };

      const scheduleRelayout = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          doRelayout();
        });
      };

      // 처음 한 번
      scheduleRelayout();

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
          // hover 등으로 크기가 살짝 바뀔 때 호출됨
          scheduleRelayout();
        });
        ro.observe(el);
        return () => ro.disconnect();
      }

      return;
    }, [children]);

    useImperativeHandle(
      ref,
      () => ({
        getOverlay: () => overlayRef.current,
        setPosition: (pos) => {
          overlayRef.current?.setPosition(pos);
          (overlayRef.current as any)?.relayout?.();
        },
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
