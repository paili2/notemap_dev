"use client";

import { useIsMobileBreakpoint } from "@/hooks/useIsMobileBreakpoint";
import { ALLOW_MOBILE_PROPERTY_EDIT } from "../constants";

export function usePropertyEditGuard() {
  // 기본 768px 미만을 모바일로
  const isMobile = useIsMobileBreakpoint(768);
  const canEditOnMobile = ALLOW_MOBILE_PROPERTY_EDIT;

  // PC는 항상 가능, 모바일은 토글 켰을 때만 가능
  const canEdit = !isMobile || canEditOnMobile;

  return { isMobile, canEdit, canEditOnMobile };
}
