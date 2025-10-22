"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEscapeToClose } from "@/hooks/useEscapeToClose";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type Props = {
  open: boolean;
  onClose: () => void;
  onResize?: () => void;
  /** Kakao Roadview가 렌더될 DOM 컨테이너 ref (useRoadview에서 전달) */
  containerRef: React.RefObject<HTMLDivElement>;
};

/**
 * 맵 위에 오버레이로 붙는 Roadview 컨테이너 (모달형)
 * - 포털로 body에 렌더
 * - 열릴 때 애니메이션 및 크기 변화 이후 onResize() 호출
 * - Escape/백드롭 클릭/닫기 버튼으로 닫힘
 */
export default function RoadviewHost({
  open,
  onClose,
  onResize,
  containerRef,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElRef = useRef<Element | null>(null);

  // ESC로 닫기 (열렸을 때만)
  useEscapeToClose(onClose, { enabled: open });

  // 바디 스크롤 잠금
  useBodyScrollLock(open);

  // 열릴 때 포커스/닫힐 때 포커스 복귀
  useEffect(() => {
    if (open) {
      lastActiveElRef.current = document.activeElement ?? null;
      // 약간의 지연 뒤 패널에 포커스
      const t = requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
      return () => cancelAnimationFrame(t);
    } else if (lastActiveElRef.current instanceof HTMLElement) {
      lastActiveElRef.current.focus();
    }
  }, [open]);

  // 안전한 relayout 트리거: ① 애니메이션 끝 ② ResizeObserver ③ rAF 2프레임
  const triggerRelayout = useCallback(() => {
    if (!onResize) return;
    // rAF 두 번으로 레이아웃 안정화 후 호출
    requestAnimationFrame(() => {
      requestAnimationFrame(() => onResize());
    });
  }, [onResize]);

  // transitionend로 패널 이동/페이드 완료 시 relayout
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current;

    const onEnd = (e: TransitionEvent) => {
      // transform 또는 opacity 변화가 끝난 경우만
      if (
        e.propertyName === "transform" ||
        e.propertyName === "opacity" ||
        e.propertyName === "height" ||
        e.propertyName === "width"
      ) {
        triggerRelayout();
      }
    };

    el.addEventListener("transitionend", onEnd);
    // 처음 열릴 때도 한 번 보정
    triggerRelayout();

    return () => el.removeEventListener("transitionend", onEnd);
  }, [open, triggerRelayout]);

  // 패널 내부 컨테이너의 크기 변화를 감지
  useEffect(() => {
    if (!open || !containerRef.current || !onResize) return;

    const ro = new ResizeObserver(() => triggerRelayout());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [open, containerRef, onResize, triggerRelayout]);

  // 백드롭 클릭으로 닫기 (패널 내부 클릭은 무시)
  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // 포털 루트 (없으면 body 사용)
  const portalRoot =
    (typeof window !== "undefined" &&
      (document.getElementById("portal-root") || document.body)) ||
    null;

  if (!portalRoot) return null;

  return createPortal(
    <div
      className={[
        "pointer-events-none fixed inset-0 z-[25000] flex items-end justify-center p-4",
        open ? "visible" : "invisible",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={[
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onBackdropClick}
        role="presentation"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          "pointer-events-auto relative w-full max-w-6xl h-[60vh] rounded-2xl bg-white shadow-xl overflow-hidden transition-transform outline-none",
          open ? "translate-y-0" : "translate-y-8",
          // 사용자가 'reduce motion' 선호 시 애니메이션 최소화
          "motion-reduce:transition-none",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="로드뷰"
        tabIndex={-1}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Kakao Roadview 컨테이너 */}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>,
    portalRoot
  );
}
