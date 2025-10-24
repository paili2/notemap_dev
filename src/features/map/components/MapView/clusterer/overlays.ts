import { PIN_MARKER, LABEL, HITBOX, Z } from "@/features/map/lib/constants";
import { getPinUrl } from "@/features/pins/lib/assets";
import type { PinKind } from "@/features/pins/types";
import {
  applyHitboxStyles,
  applyLabelStyles,
  applyOrderBadgeToLabel,
} from "./style";

export function createMarker(
  kakao: any,
  pos: any,
  opts: {
    isDraft: boolean;
    key: string;
    kind: PinKind;
    title?: string | null;
  }
) {
  const mkOptions: any = {
    position: pos,
    title: opts.title ?? opts.key,
    zIndex: opts.isDraft ? Z.DRAFT_PIN : 0,
  };

  const iconUrl = getPinUrl(opts.kind);
  if (iconUrl && typeof iconUrl === "string") {
    const markerSize = new kakao.maps.Size(
      PIN_MARKER.size.w,
      PIN_MARKER.size.h
    );
    const markerOffset = new kakao.maps.Point(
      PIN_MARKER.offset.x,
      PIN_MARKER.offset.y
    );
    mkOptions.image = new kakao.maps.MarkerImage(iconUrl, markerSize, {
      offset: markerOffset,
    });
  }

  return new kakao.maps.Marker(mkOptions);
}

/**
 * 라벨 오버레이 생성
 * @param labelGapPx 라벨-핀 간격(px)
 * @param order 0-based 예약 순번(라벨 배지로 1-based로 표기). number가 아닐 경우 배지 미표시
 */

// src/features/map/lib/overlays/create.ts (createLabelOverlay 부분만 발췌)
export function createLabelOverlay(
  kakao: any,
  pos: any,
  text: string,
  labelGapPx: number,
  order?: number | null
) {
  const labelEl = document.createElement("div");
  labelEl.className = "kakao-label";
  (labelEl as any).dataset.rawTitle = String(text ?? "");

  applyLabelStyles(labelEl as HTMLDivElement, labelGapPx);
  (labelEl as HTMLDivElement).style.color = "#FFFFFF";

  const orderNum =
    typeof order === "number" && Number.isFinite(order) ? order : undefined;
  applyOrderBadgeToLabel(labelEl as HTMLDivElement, text, orderNum);

  // ✅ 제목 span만 복원 (외부 래퍼/배지는 건드리지 않음)
  try {
    const mo = new MutationObserver(() => {
      const want = (labelEl as any).dataset?.rawTitle ?? "";
      const titleEl = labelEl.querySelector(
        '[data-role="label-title"]'
      ) as HTMLSpanElement | null;
      if (!titleEl) return;
      const now = titleEl.textContent ?? "";
      if (now !== want) titleEl.textContent = want; // ✨ 전체 비우지 않음
    });
    mo.observe(labelEl, { characterData: true, subtree: true });
  } catch {}

  return new kakao.maps.CustomOverlay({
    position: pos,
    content: labelEl,
    xAnchor: 0.5,
    yAnchor: 1,
    zIndex: LABEL.Z_INDEX,
  });
}

export function createHitboxOverlay(
  kakao: any,
  pos: any,
  hitboxSizePx: number,
  onClick: () => void
) {
  const hitEl = document.createElement("div");
  hitEl.className = "kakao-hitbox";
  applyHitboxStyles(hitEl as HTMLDivElement, hitboxSizePx);

  // 이벤트 위임
  hitEl.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  });

  return new kakao.maps.CustomOverlay({
    position: pos,
    content: hitEl,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: HITBOX.Z_INDEX,
    clickable: true,
  });
}
