"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CustomOverlayProps } from "./types";

export default function CustomOverlay({
  kakao,
  map,
  position,
  xAnchor = 0.5,
  yAnchor = 1, // 1 권장 (아래가 기준)
  zIndex = 10000,
  className,
  pointerEventsEnabled = true,
  children,
}: CustomOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const rAFRef = useRef<number | null>(null);

  // 컨테이너 DOM 생성 (최초 1회)
  if (!containerRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    if (className) el.className = className;
    el.style.pointerEvents = pointerEventsEnabled ? "auto" : "none";
    containerRef.current = el;
  }

  // className / pointer-events 동기화
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (className !== undefined) el.className = className || "";
    el.style.pointerEvents = pointerEventsEnabled ? "auto" : "none";
  }, [className, pointerEventsEnabled]);

  // 오버레이 생성 / 제거 (레이아웃 시점에 생성)
  useLayoutEffect(() => {
    if (!kakao || !map || !containerRef.current) return;

    const ov = new kakao.maps.CustomOverlay({
      position, // 최초 위치
      content: containerRef.current,
      xAnchor,
      yAnchor,
      zIndex,
      clickable: true, // 내부 클릭 허용
    });
    overlayRef.current = ov;

    // ✅ 최초 렌더 프레임에서 바로 붙이지 말고,
    //    다음 animation frame에 붙여서 마커/라벨 토글 이후에 나타나게 한다.
    rAFRef.current = requestAnimationFrame(() => {
      ov.setMap(map);
    });

    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      ov.setMap(null);
      overlayRef.current = null;
    };
    // position/zIndex 업데이트는 아래 별도 effect로 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kakao, map, xAnchor, yAnchor]); // zIndex/position 제외

  // 위치 업데이트 (layout 시점)
  useLayoutEffect(() => {
    overlayRef.current?.setPosition(position);
  }, [position]);

  // zIndex 업데이트 (layout 시점)
  useLayoutEffect(() => {
    overlayRef.current?.setZIndex(zIndex);
  }, [zIndex]);

  // 이벤트 버블링 방지 (지도 제스처로 전파되지 않게)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stop = (e: Event) => e.stopPropagation();
    const stopAndPrevent = (e: Event) => {
      e.stopPropagation();
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
