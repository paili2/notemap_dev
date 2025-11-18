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
      // 위치 바뀔 때도 한번 레이아웃 정리
      (ov as any).relayout?.();
    }, [position]);

    // zIndex 변경
    useEffect(() => {
      overlayRef.current?.setZIndex(zIndex ?? 10_000);
    }, [zIndex]);

    // ✅ 내용/크기 변화에 따른 relayout (PC에서 제목 길어질 때 중앙 맞추기용)
    useEffect(() => {
      const ov = overlayRef.current;
      const el = containerRef.current;
      if (!ov || !el) return;

      const doRelayout = () => {
        try {
          // 혹시 모를 content 변경 반영
          ov.setContent(el);
          (ov as any).relayout?.();
        } catch {
          /* ignore */
        }
      };

      // 처음 한 번
      doRelayout();

      // ResizeObserver로 폭/높이 변할 때마다 재계산
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
          doRelayout();
        });
        ro.observe(el);
        return () => ro.disconnect();
      }

      // 폴백: ResizeObserver 없는 환경에서는 그냥 한 번만
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
