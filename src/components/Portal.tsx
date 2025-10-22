"use client";
import { createPortal } from "react-dom";
import * as React from "react";

type PortalProps = {
  children: React.ReactNode;
  container?: Element | DocumentFragment | null;
};

export default function Portal({ children, container }: PortalProps) {
  const defaultTarget =
    typeof document !== "undefined" ? (document.body as Element) : null;

  // ✅ 초기 렌더부터 바로 body를 사용
  const [target, setTarget] = React.useState<Element | DocumentFragment | null>(
    container ?? defaultTarget
  );

  // ✅ 레이아웃 페이즈에서 대상 동기화 (깜빡임/지연 방지)
  React.useLayoutEffect(() => {
    setTarget(container ?? defaultTarget);
  }, [container, defaultTarget]);

  if (!target) return null;
  return createPortal(children, target);
}
