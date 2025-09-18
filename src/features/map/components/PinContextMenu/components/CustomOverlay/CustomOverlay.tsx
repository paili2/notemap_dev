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
    // 내용만큼만 차지 + 과도한 가로 확장 방지
    el.style.display = "inline-block";
    el.style.width = "max-content";
    // 포인터 이벤트 정책 초기 적용
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
      // ⬇️ 상호작용이 필요한 경우에만 클릭 가능
      clickable: pointerEventsEnabled,
    });
    overlayRef.current = ov;

    // 다음 animation frame에 붙여서 마커/라벨 토글 이후 나타나게
    rAFRef.current = requestAnimationFrame(() => {
      ov.setMap(map);
    });

    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      ov.setMap(null);
      overlayRef.current = null;
    };
    // pointerEventsEnabled 변경 시 clickable도 재구성되도록 포함
  }, [kakao, map, xAnchor, yAnchor, pointerEventsEnabled]);

  // 위치 업데이트 (layout 시점)
  useLayoutEffect(() => {
    overlayRef.current?.setPosition(position);
  }, [position]);

  // zIndex 업데이트 (layout 시점)
  useLayoutEffect(() => {
    overlayRef.current?.setZIndex(zIndex);
  }, [zIndex]);

  // 이벤트 버블링/스크롤 차단: "클릭 가능한" 오버레이일 때만
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!pointerEventsEnabled) return;

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
  }, [pointerEventsEnabled]);

  if (!containerRef.current) return null;
  return createPortal(children, containerRef.current);
}
