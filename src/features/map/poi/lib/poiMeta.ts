import type { LucideIcon } from "lucide-react";
import {
  Train,
  Coffee,
  Store,
  Pill,
  School,
  ParkingCircle,
  ShieldCheck,
  TreePine,
  ShoppingCart,
  Cross,
  Landmark,
} from "lucide-react";
import type { PoiKind, PoiIconSpec } from "./poiTypes";

/** 버튼/토글 등에 쓰는 라벨 (메뉴에서 import 해 사용) */
export const POI_LABEL: Record<PoiKind, string> = {
  convenience: "편의점",
  mart: "마트",
  cafe: "카페",
  pharmacy: "약국",
  hospital: "병원",
  subway: "지하철역",
  parking: "주차장",
  school: "학교",
  safety: "안전기관", // ✅ 경찰서 + 소방서 등
  culture: "문화시설",
  park: "공원",
};

/** Kakao Places 카테고리 코드 매핑 (대략적인 값) */
export const KAKAO_CATEGORY: Partial<Record<PoiKind, string>> = {
  convenience: "CS2", // 편의점
  mart: "MT1", // 대형마트
  cafe: "CE7", // 카페
  pharmacy: "PM9", // 약국
  hospital: "HP8", // 병원
  subway: "SW8", // 지하철역
  parking: "PK6", // 주차장
  school: "SC4", // 학교
  safety: "PO3", // 공공기관(경찰/소방 등)
  culture: "CT1", // 문화시설
  park: "PK6", // 공원
};

/** 키워드(필요 시 사용) */
export const KAKAO_KEYWORD: Record<PoiKind, string | string[] | undefined> = {
  convenience: undefined,
  mart: undefined,
  cafe: undefined,
  pharmacy: undefined,
  hospital: undefined,
  subway: undefined,
  parking: undefined,
  school: undefined,
  safety: ["경찰서", "소방서"],
  culture: "문화시설",
  park: "공원",
};

/** 간단한 원형 SVG data URI 생성 */
export function svgDot(bg: string, size = 28) {
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
  mart: { url: svgDot("#059669"), size: [28, 28], offset: [14, 14] },
  cafe: { url: svgDot("#f59e0b"), size: [28, 28], offset: [14, 14] },
  pharmacy: { url: svgDot("#ef4444"), size: [28, 28], offset: [14, 14] },
  hospital: { url: svgDot("#dc2626"), size: [28, 28], offset: [14, 14] },
  subway: { url: svgDot("#3b82f6"), size: [28, 28], offset: [14, 14] },
  parking: { url: svgDot("#1d4ed8"), size: [28, 28], offset: [14, 14] },
  school: { url: svgDot("#8b5cf6"), size: [28, 28], offset: [14, 14] },
  safety: { url: svgDot("#0f766e"), size: [28, 28], offset: [14, 14] },
  culture: { url: svgDot("#ea580c"), size: [28, 28], offset: [14, 14] },
  park: { url: svgDot("#16a34a"), size: [28, 28], offset: [14, 14] },
};

/** (오버레이용) 배경색 & 아이콘 매핑 */
export const POI_BG: Record<PoiKind, string> = {
  convenience: "#10b981",
  mart: "#059669",
  cafe: "#f59e0b",
  pharmacy: "#ef4444",
  hospital: "#dc2626",
  subway: "#3b82f6",
  parking: "#1d4ed8",
  school: "#8b5cf6",
  safety: "#0f766e",
  culture: "#ea580c",
  park: "#16a34a",
};

export const POI_ICON_COMP: Partial<Record<PoiKind, LucideIcon>> = {
  convenience: Store,
  mart: ShoppingCart,
  cafe: Coffee,
  pharmacy: Pill,
  hospital: Cross,
  subway: Train,
  school: School,
  parking: ParkingCircle,
  safety: ShieldCheck,
  culture: Landmark,
  park: TreePine,
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
