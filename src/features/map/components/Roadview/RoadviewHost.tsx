"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onResize?: () => void;
  /** Kakao Roadview가 렌더될 DOM 컨테이너 ref (useRoadview에서 전달) */
  containerRef: React.RefObject<HTMLDivElement>;
};

/**
 * 맵 위에 오버레이로 붙는 Roadview 컨테이너
 * - open=true일 때만 보이며, CSS 애니메이션 후 relayout을 호출
 */
export default function RoadviewHost({
  open,
  onClose,
  onResize,
  containerRef,
}: Props) {
  useEffect(() => {
    if (open) {
      // 살짝 지연 후 relayout
      const t = setTimeout(() => onResize?.(), 150);
      return () => clearTimeout(t);
    }
  }, [open, onResize]);

  return (
    <div
      className={[
        "pointer-events-none fixed inset-0 z-[25000] flex items-end justify-center p-4",
        open ? "visible" : "invisible",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* 반투명 배경 */}
      <div
        className={[
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      {/* 하단 슬라이드 패널 */}
      <div
        className={[
          "pointer-events-auto relative w-full max-w-6xl h-[60vh] rounded-2xl bg-white shadow-xl overflow-hidden transition-transform",
          open ? "translate-y-0" : "translate-y-8",
        ].join(" ")}
        role="dialog"
        aria-label="로드뷰"
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
    </div>
  );
}
