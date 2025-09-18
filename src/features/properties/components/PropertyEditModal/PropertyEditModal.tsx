"use client";

import * as React from "react";
import PropertyEditModalBody from "./PropertyEditModalBody";
import type { PropertyEditModalProps } from "./types";

/**
 * Standalone 편집 모달 래퍼.
 * - open === true 일 때만 렌더
 * - 내부 Body는 오버레이/딤이 포함된 기본 모드로 렌더됩니다(embedded=false).
 *   (ViewModal 안에서 내용만 교체해 쓰고 싶다면 PropertyEditModalBody를 embedded 모드로 직접 사용하세요.)
 */
export default function PropertyEditModal(props: PropertyEditModalProps) {
  const { open, ...rest } = props;
  if (!open) return null;

  // Body 컴포넌트가 embedded prop을 지원하도록 수정했다면 아래처럼 명시적으로 false를 넘겨주세요.
  type BodyProps = Omit<PropertyEditModalProps, "open"> & {
    embedded?: boolean;
  };

  return <PropertyEditModalBody {...(rest as BodyProps)} embedded={false} />;
}
