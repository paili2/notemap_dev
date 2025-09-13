"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import SidebarToggleButton from "./components/SidebarToggleButton";
import { cn } from "@/lib/utils";

export type ToggleSidebarProps = {
  className?: string;

  /** 신규 컨트롤드 API */
  controlledOpen?: boolean;
  onChangeOpen?: (open: boolean) => void;

  /** 구버전 호환 API */
  isSidebarOn?: boolean;
  onToggleSidebar?: () => void;

  /** 위치/레이어링 (구버전 유지) */
  offsetTopPx?: number; // default 12
  fixedRightPx?: number; // default 12 (right-3 대용)
  zIndex?: number; // default 90
  overlay?: boolean; // default true: 지도 위 오버레이처럼 렌더

  /** 단축키 */
  hotkey?: boolean;

  /** 언컨트롤드 초기값 */
  defaultOpen?: boolean;

  /** 접근성 레이블 */
  ariaLabelOpen?: string;
  ariaLabelClose?: string;
};

function ToggleSidebarBase({
  className,
  // 신규
  controlledOpen,
  onChangeOpen,

  // 구버전 호환
  isSidebarOn,
  onToggleSidebar,

  // 위치/오버레이
  offsetTopPx = 12,
  fixedRightPx = 12,
  zIndex = 90,
  overlay = true,

  // 기타
  hotkey = true,
  defaultOpen = true,
  ariaLabelOpen = "사이드바 닫기",
  ariaLabelClose = "사이드바 열기",
}: ToggleSidebarProps) {
  // 1) 상태 결정 (신규 컨트롤드 > 구버전 컨트롤드 > 로컬)
  const legacyControlled = isSidebarOn !== undefined && !!onToggleSidebar;
  const isControlled = controlledOpen !== undefined || legacyControlled;

  const [innerOpen, setInnerOpen] = useState(defaultOpen);

  const open = useMemo(() => {
    if (controlledOpen !== undefined) return controlledOpen;
    if (legacyControlled) return isSidebarOn as boolean;
    return innerOpen;
  }, [controlledOpen, legacyControlled, isSidebarOn, innerOpen]);

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen !== undefined) {
        onChangeOpen?.(v);
        return;
      }
      if (legacyControlled) {
        // 구버전은 토글 콜백만 있으므로 상태만 맞추도록 호출
        if (v !== (isSidebarOn as boolean)) onToggleSidebar?.();
        return;
      }
      setInnerOpen(v);
      onChangeOpen?.(v);
    },
    [
      controlledOpen,
      onChangeOpen,
      legacyControlled,
      isSidebarOn,
      onToggleSidebar,
    ]
  );

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  // 2) 단축키
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, toggle]);

  // 3) 접근성 라벨
  const ariaLabel = open ? ariaLabelOpen : ariaLabelClose;

  // 4) 위치/오버레이 래퍼 (원래 UI 유지)
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (!overlay) {
      // 레이아웃 안에서 쓸 때
      return <div className={className}>{children}</div>;
    }
    return (
      <div
        className={cn("absolute", className)}
        style={{
          right: fixedRightPx,
          top: offsetTopPx,
          zIndex,
          pointerEvents: "none",
        }}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          {children}
        </div>
      </div>
    );
  };

  return (
    <Wrapper>
      <SidebarToggleButton
        pressed={open}
        onPress={toggle}
        ariaLabel={ariaLabel}
        title={`${ariaLabel} (Cmd/Ctrl+B)`}
      />
    </Wrapper>
  );
}

export default memo(ToggleSidebarBase);
