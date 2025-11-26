"use client";

import type { PropertyCreateModalProps } from "./types";
import PropertyCreateModalBody from "./PropertyCreateModalBody";

/** 래퍼: open이 false면 아예 바디를 렌더하지 않음 */
export default function PropertyCreateModal(props: PropertyCreateModalProps) {
  if (!props.open) return null;

  // ✅ createPinKind를 꺼내서 initialPinKind로 넘겨주기
  const { open, createPinKind, ...rest } = props;

  return (
    <PropertyCreateModalBody initialPinKind={createPinKind ?? null} {...rest} />
  );
}
