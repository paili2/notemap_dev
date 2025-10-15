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
    title: opts.isDraft ? "답사예정" : opts.title ?? opts.key,
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

export function createLabelOverlay(
  kakao: any,
  pos: any,
  text: string,
  labelGapPx: number,
  order?: number | null
) {
  const labelEl = document.createElement("div");
  labelEl.className = "kakao-label";
  (labelEl as any).dataset.rawLabel = text;
  applyLabelStyles(labelEl as HTMLDivElement, labelGapPx);
  (labelEl as HTMLDivElement).style.color = "#FFFFFF";
  applyOrderBadgeToLabel(labelEl as HTMLDivElement, text, order);

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
  applyHitboxStyles(hitEl as HTMLDivElement, hitboxSizePx); // ← number 파라미터 OK
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
