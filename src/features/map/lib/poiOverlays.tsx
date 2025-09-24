"use client";

import React from "react";
import ReactDOM from "react-dom/client";
import type { LucideIcon, LucideProps } from "lucide-react";
// lucide 버전에 BusFront가 있으면 교체해서 쓰세요.
import { Train, Coffee, Store, Pill /* , BusFront */, Bus } from "lucide-react";

/** POI 종류 */
export type PoiKind = "convenience" | "cafe" | "pharmacy" | "subway" | "bus";

/** POI 한 점 */
export type PoiPoint = {
  id: string;
  kind: PoiKind;
  lat: number;
  lng: number;
  zIndex?: number;
};

/** 버튼/토글 등에 쓰는 라벨 */
export const POI_LABEL: Record<PoiKind, string> = {
  convenience: "편의점",
  cafe: "카페",
  pharmacy: "약국",
  subway: "지하철역",
  bus: "버스정류장",
};

/** Kakao Places 카테고리 코드 매핑 (버스는 카테고리 코드가 없음) */
export const KAKAO_CATEGORY: Partial<Record<PoiKind, string>> = {
  convenience: "CS2",
  cafe: "CE7",
  pharmacy: "PM9",
  subway: "SW8",
};

/** 카테고리 코드가 없는 버스정류장만 키워드 검색 사용 */
export const KAKAO_KEYWORD: Record<PoiKind, string | string[] | undefined> = {
  convenience: undefined,
  cafe: undefined,
  pharmacy: undefined,
  subway: undefined,
  bus: ["버스정류장", "정류장", "버스", "승강장"],
};

/** (마커 API용) 아이콘 스펙 */
export type PoiIconSpec = {
  url: string;
  size: [number, number]; // [w, h]
  offset: [number, number]; // [x, y]
};

/** 간단한 원형 SVG data URI 생성 */
function svgDot(bg: string, size = 28) {
  const r = Math.floor(size / 2) - 2;
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <circle cx='${cx}' cy='${cy}' r='${r}' fill='${bg}' />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** (마커 API용) POI별 아이콘 프리셋 — 필요 시 사용 */
export const POI_ICON: Record<PoiKind, PoiIconSpec> = {
  convenience: { url: svgDot("#10b981"), size: [28, 28], offset: [14, 14] },
  cafe: { url: svgDot("#f59e0b"), size: [28, 28], offset: [14, 14] },
  pharmacy: { url: svgDot("#ef4444"), size: [28, 28], offset: [14, 14] },
  subway: { url: svgDot("#3b82f6"), size: [28, 28], offset: [14, 14] },
  bus: { url: svgDot("#0ea5e9"), size: [28, 28], offset: [14, 14] },
};

/** (오버레이용) 배경색 & 아이콘 매핑 */
const POI_BG: Record<PoiKind, string> = {
  convenience: "#10b981",
  cafe: "#f59e0b",
  pharmacy: "#ef4444",
  subway: "#3b82f6",
  bus: "#0ea5e9",
};

// lucide에 BusFront가 없으면 Bus로, 지하철은 임시로 Train 사용
const POI_ICON_COMP: Record<PoiKind, LucideIcon> = {
  convenience: Store,
  cafe: Coffee,
  pharmacy: Pill,
  subway: Train,
  // bus: BusFront,
  bus: Bus,
};

/** 줌 레벨(작을수록 확대)에 따른 크기 계산 */
export function calcPoiSizeByLevel(level: number) {
  // level 3에서 36px, level 12에서 16px 사이로 선형 보간
  const maxSize = 36;
  const minSize = 16;
  const t = (level - 3) / (12 - 3); // 0~1
  const clamped = Math.min(1, Math.max(0, t));
  const size = Math.round(maxSize - (maxSize - minSize) * clamped);
  const iconSize = Math.max(10, Math.round(size * 0.58));
  return { size, iconSize };
}

/** 오버레이 내용: React 컴포넌트(재렌더로만 갱신 → 깜빡임 최소화) */
function PoiBubble({
  kind,
  size,
  iconSize,
  onClick,
}: {
  kind: PoiKind;
  size: number;
  iconSize: number;
  onClick?: () => void;
}) {
  const Icon = POI_ICON_COMP[kind];
  return (
    <div
      onClick={onClick}
      role="img"
      aria-label={POI_LABEL[kind]}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: POI_BG[kind],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        color: "#fff",
        userSelect: "none",
      }}
    >
      <Icon
        size={iconSize as LucideProps["size"]}
        strokeWidth={2.25}
        color="#fff"
      />
    </div>
  );
}

/** 하나의 CustomOverlay 생성 */
export function createPoiOverlay(
  kakaoSDK: typeof window.kakao,
  map: kakao.maps.Map,
  poi: PoiPoint,
  opts?: { onClick?: (poiId: string) => void; size?: number; iconSize?: number }
) {
  let curKind: PoiKind = poi.kind;
  let curSize = opts?.size ?? 32;
  let curIconSize = opts?.iconSize ?? 16;

  // DOM 컨테이너 & React root (한 번만 생성)
  const el = document.createElement("div");
  el.style.position = "relative";
  const root = ReactDOM.createRoot(el);

  const render = () => {
    root.render(
      <PoiBubble
        kind={curKind}
        size={curSize}
        iconSize={curIconSize}
        onClick={opts?.onClick ? () => opts.onClick!(poi.id) : undefined}
      />
    );
  };
  render();

  const overlay = new kakaoSDK.maps.CustomOverlay({
    position: new kakaoSDK.maps.LatLng(poi.lat, poi.lng),
    content: el,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: poi.zIndex ?? 3,
  });
  overlay.setMap(map);

  /** 제거 */
  const destroy = () => {
    overlay.setMap(null);
    root.unmount();
  };

  /** 변경 사항 반영(위치/zIndex/종류/크기) — React root는 재사용 */
  const update = (
    next: Partial<PoiPoint> & { size?: number; iconSize?: number }
  ) => {
    if (typeof next.lat === "number" && typeof next.lng === "number") {
      overlay.setPosition(new kakaoSDK.maps.LatLng(next.lat, next.lng));
    }
    if (typeof next.zIndex === "number") {
      overlay.setZIndex(next.zIndex);
    }

    let needRender = false;
    if (next.kind && next.kind !== curKind) {
      curKind = next.kind;
      needRender = true;
    }
    if (typeof next.size === "number" && next.size !== curSize) {
      curSize = next.size;
      needRender = true;
    }
    if (typeof next.iconSize === "number" && next.iconSize !== curIconSize) {
      curIconSize = next.iconSize;
      needRender = true;
    }
    if (needRender) render();
  };

  return { overlay, update, destroy };
}

/** 여러 개를 관리하는 훅 (id 기준 diff) */
export function usePoiOverlays(params: {
  kakaoSDK: typeof window.kakao | null;
  map: kakao.maps.Map | null;
  pois: PoiPoint[];
  onClick?: (poiId: string) => void;
}) {
  const { kakaoSDK, map, pois, onClick } = params;
  const ref = React.useRef<
    Map<
      string,
      {
        destroy: () => void;
        update: (
          p: Partial<PoiPoint> & { size?: number; iconSize?: number }
        ) => void;
      }
    >
  >(new Map());

  React.useEffect(() => {
    if (!kakaoSDK || !map) return;

    const overlays = ref.current;
    const nextIds = new Set<string>(pois.map((p) => p.id));

    // upsert
    for (const p of pois) {
      const ex = overlays.get(p.id);
      if (ex) {
        ex.update({ lat: p.lat, lng: p.lng, zIndex: p.zIndex, kind: p.kind });
      } else {
        const { destroy, update } = createPoiOverlay(kakaoSDK, map, p, {
          onClick,
        });
        overlays.set(p.id, { destroy, update });
      }
    }

    // remove stale
    for (const [id, inst] of overlays.entries()) {
      if (!nextIds.has(id)) {
        inst.destroy();
        overlays.delete(id);
      }
    }

    return () => {
      // SDK/Map 교체 시 모두 정리
      for (const [, inst] of overlays) inst.destroy();
      overlays.clear();
    };
  }, [kakaoSDK, map, pois, onClick]);

  return { count: ref.current.size };
}
