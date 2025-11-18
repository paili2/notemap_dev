"use client";

import type { PropertyCreateModalProps } from "./types";
import PropertyCreateModalBody from "./PropertyCreateModalBody";

/** 래퍼: open이 false면 아예 바디를 렌더하지 않음 */
export default function PropertyCreateModal(props: PropertyCreateModalProps) {
  if (!props.open) return null;

  // open 제외하고 모두 Body로 전달 (initialLat/initialLng 포함)
  const { open, ...rest } = props;
  return <PropertyCreateModalBody {...rest} />;
}
