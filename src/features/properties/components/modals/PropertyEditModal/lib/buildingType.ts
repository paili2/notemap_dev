import { BuildingType } from "@/features/properties/types/property-domain";

/** UI에서 허용하는 등기/건물타입 (라디오 버튼 라벨 기준) */
export const BUILDING_TYPES: BuildingType[] = [
  "주택",
  "APT",
  "OP",
  "도생",
  "근생",
];

/**
 * 서버/폼 값 → 우리가 쓰는 라벨로 정규화
 * - 문자열뿐 아니라 { value, label } 같은 객체도 처리
 * - 오피스텔 / OFFICETEL / op 등은 전부 "OP" 로 통일
 */
export const normalizeBuildingType = (v: any): BuildingType | undefined => {
  if (v == null) return undefined;

  let s = "";

  if (typeof v === "string") {
    s = v.trim();
  } else if (typeof v === "object") {
    const cand =
      v.value ?? v.code ?? v.key ?? v.label ?? v.name ?? v.id ?? v.text ?? "";
    if (typeof cand === "string") s = cand.trim();
  }

  if (!s) return undefined;

  const upper = s.toUpperCase();

  // 한국어 / 코드 여러 패턴을 우리 라벨로 매핑
  if (s === "주택") return "주택";

  if (upper === "APT" || s === "아파트") return "APT";

  if (upper === "OP" || upper === "OFFICETEL" || s === "오피스텔") {
    return "OP";
  }

  if (s === "도생" || s === "도시형생활주택") return "도생";

  if (s === "근생" || s === "근린생활시설") return "근생";

  // 혹시 이미 라벨 그대로 들어온 경우
  if (BUILDING_TYPES.includes(s as BuildingType)) {
    return s as BuildingType;
  }

  return undefined;
};
