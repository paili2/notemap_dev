import { PropertyEditItem } from "@/features/properties/components/modals/PropertyEditModal/types";
import type { OrientationValue } from "@/features/properties/types/property-domain";

// ---- helpers ----
const toNum = (v: unknown) => {
  if (v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/[, ]+/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

function ymToYmd(v?: string | Date | null): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  // "YYYY-MM-DD"
  if (/^\d{4}[-/\.]\d{2}[-/\.]\d{2}$/.test(s)) {
    return s.replace(/[\/\.]/g, "-");
  }
  // "YYYY-MM" → "YYYY-MM-01"
  const m = s.match(/^(\d{4})[-/\.](\d{1,2})$/);
  if (m) {
    const y = m[1];
    const mm = String(Number(m[2])).padStart(2, "0");
    return `${y}-${mm}-01`;
  }
  return undefined;
}

function aspectsToDirections(
  aspects?: { no: number; dir: OrientationValue | "" }[]
): { direction: string }[] | undefined {
  if (!Array.isArray(aspects)) return undefined;
  const rows = aspects
    .filter((r) => typeof r?.dir === "string" && r.dir.length > 0)
    .map((r) => ({ direction: r.dir as string }));
  return rows.length ? rows : undefined;
}

/**
 * ⚠️ 도메인 AreaSet(string 기반)과 헷갈리지 않도록
 * 이 파일 내부 전용 타입 이름을 AreaGroupInput 으로 사용
 */
type AreaGroupInput = {
  title?: string;
  exclusive?: { minM2?: number; maxM2?: number };
  real?: { minM2?: number; maxM2?: number };
};

function areaSetsToPinGroups(
  base?: AreaGroupInput,
  extras?: AreaGroupInput[]
):
  | {
      title: string;
      exclusiveMinM2?: number;
      exclusiveMaxM2?: number;
      actualMinM2?: number;
      actualMaxM2?: number;
      sortOrder: number;
    }[]
  | undefined {
  const items: AreaGroupInput[] = [
    ...(base ? [base] : []),
    ...((Array.isArray(extras) ? extras : []).filter(
      Boolean
    ) as AreaGroupInput[]),
  ];
  if (!items.length) return undefined;

  return items.map((s, idx) => ({
    title: String(s?.title ?? "").slice(0, 50),
    exclusiveMinM2: toNum(s?.exclusive?.minM2),
    exclusiveMaxM2: toNum(s?.exclusive?.maxM2),
    actualMinM2: toNum(s?.real?.minM2),
    actualMaxM2: toNum(s?.real?.maxM2),
    sortOrder: idx,
  }));
}

// 옵션 매핑: string[] + optionEtc → backend options 객체
function buildOptionsObject(
  options?: string[] | null,
  optionEtc?: string | null
):
  | {
      hasAircon?: boolean;
      hasFridge?: boolean;
      hasWasher?: boolean;
      hasDryer?: boolean;
      hasBidet?: boolean;
      hasAirPurifier?: boolean;
      extraOptionsText?: string;
    }
  | undefined {
  if (!Array.isArray(options) && !optionEtc) return undefined;
  const set = new Set(
    (options ?? []).map((s) => String(s).trim().toLowerCase())
  );

  const obj: any = {};
  // 네 프로젝트의 프리셋 라벨 기준으로 매핑 (필요시 키워드 추가/수정)
  obj.hasAircon = set.has("에어컨") || set.has("aircon") || undefined;
  obj.hasFridge = set.has("냉장고") || set.has("fridge") || undefined;
  obj.hasWasher = set.has("세탁기") || set.has("washer") || undefined;
  obj.hasDryer = set.has("건조기") || set.has("dryer") || undefined;
  obj.hasBidet = set.has("비데") || set.has("bidet") || undefined;
  obj.hasAirPurifier =
    set.has("공기순환기") || set.has("airpurifier") || undefined;

  if (optionEtc && optionEtc.trim() !== "") {
    obj.extraOptionsText = optionEtc.trim();
  }

  // 모두 undefined면 undefined 반환
  return Object.values(obj).some((v) => v !== undefined) ? obj : undefined;
}

// ---- main mapper ----
export function buildPinPatchBody(item: PropertyEditItem) {
  const body: any = {};

  // 이름/주소 매핑
  if (item.title?.trim()) body.name = item.title.trim();
  if (item.address?.trim()) body.addressLine = item.address.trim();

  // 엘리베이터
  if (item.elevator === "O") body.hasElevator = true;
  else if (item.elevator === "X") body.hasElevator = false;

  // 총 세대/주차
  const totalHouseholds = toNum(item.totalHouseholds);
  if (totalHouseholds !== undefined) body.totalHouseholds = totalHouseholds;

  const totalParkingSlots = toNum(item.totalParkingSlots);
  if (totalParkingSlots !== undefined)
    body.totalParkingSlots = totalParkingSlots;

  // 준공일 (YYYY-MM → YYYY-MM-01 보정)
  const completion = ymToYmd(item.completionDate);
  if (completion) body.completionDate = completion;

  // 메모
  if (item.publicMemo?.trim()) body.publicMemo = item.publicMemo.trim();
  if (item.secretMemo?.trim()) body.privateMemo = item.secretMemo.trim();

  // 방향 → directions (전체 교체 규칙: 배열을 보내면 replace)
  const directions = aspectsToDirections(item.aspects);
  if (directions) body.directions = directions;
  // 만약 “전부 삭제”를 원하면 빈 배열 []을 명시적으로 넣어야 함 (replace 규칙)
  // body.directions = [];

  // areaGroups (전체 교체)
  const areaGroups = areaSetsToPinGroups(
    item.baseAreaSet as AreaGroupInput | undefined,
    item.extraAreaSets as AreaGroupInput[] | undefined
  );
  if (areaGroups) body.areaGroups = areaGroups;
  // 전부 삭제하려면 [] 전송

  // options: 객체면 upsert, null이면 삭제
  const optObj = buildOptionsObject(item.options, item.optionEtc);
  if (optObj) {
    body.options = optObj; // upsert
  }
  // 옵션을 완전히 제거하려면 명시적으로: body.options = null;

  // units: 현재 UI 타입이 다르면 스킵(미구현). 전체 교체 규칙에 맞춰 변환 필요 시 여기서 매핑.
  // body.units = [...]

  // 좌표(lat/lng) 업데이트가 필요한 화면이라면 별도 인자에서 받아 세팅:
  // body.lat = ...
  // body.lng = ...
  // (유효성: Number.isFinite 검사에 통과하는 number만 보내도록 주의)

  return body;
}
