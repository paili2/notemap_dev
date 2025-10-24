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
export function createLabelOverlay(
  kakao: any,
  pos: any,
  text: string,
  labelGapPx: number,
  order?: number | null
) {
  const labelEl = document.createElement("div");
  labelEl.className = "kakao-label";
  // 원문 라벨을 dataset에 보관(접근성/디버그용)
  (labelEl as any).dataset.rawLabel = String(text ?? "");

  // 스타일 적용
  applyLabelStyles(labelEl as HTMLDivElement, labelGapPx);
  (labelEl as HTMLDivElement).style.color = "#FFFFFF";

  // ✅ 순번 배지 적용 (0도 표시되도록 number 체크)
  const orderNum =
    typeof order === "number" && Number.isFinite(order) ? order : undefined;
  applyOrderBadgeToLabel(labelEl as HTMLDivElement, text, orderNum);

  try {
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "childList" || m.type === "characterData") {
          const want = (labelEl as any).dataset?.rawLabel ?? "";
          const now = labelEl.textContent ?? "";
          if (now !== want && want) {
            console.warn("[LABEL CHANGED → RESTORE]", {
              now,
              want,
              html: labelEl.innerHTML,
              stack: new Error().stack,
            });
            // 원문으로 되돌림
            labelEl.textContent = "";
            applyOrderBadgeToLabel(labelEl as HTMLDivElement, want, orderNum);
          }
        }
      }
    });
    mo.observe(labelEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
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
