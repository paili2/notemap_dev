"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CustomOverlayProps } from "./types";

export default function CustomOverlay({
  kakao,
  map,
  position,
  xAnchor = 0.5,
  yAnchor = 1.1,
  zIndex = 10000,
  className,
  pointerEventsEnabled = true,
  children,
}: CustomOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

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

  // 오버레이 생성 / 제거
  useEffect(() => {
    if (!kakao || !map || !containerRef.current) return;

    const ov = new kakao.maps.CustomOverlay({
      position, // 최초 위치
      content: containerRef.current,
      xAnchor,
      yAnchor,
      zIndex,
      clickable: true, // 내부 클릭 허용
    });

    ov.setMap(map);
    overlayRef.current = ov;

    return () => {
      ov.setMap(null);
      overlayRef.current = null;
    };
    // ❗ position/zIndex를 deps에서 제외 → 업데이트는 아래 effect에서
  }, [kakao, map, xAnchor, yAnchor, zIndex]);

  // 위치 / zIndex 업데이트
  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setPosition(position);
  }, [position]);

  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setZIndex(zIndex);
  }, [zIndex]);

  // 내부 이벤트 버블링 방지 (지도 클릭/드래그로 전파되지 않게)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stop = (e: Event) => e.stopPropagation();
    const stopAndPrevent = (e: Event) => {
      e.stopPropagation();
      // 터치/휠 제스처가 지도에 먹지 않도록
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
