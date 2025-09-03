import type {
  AspectRowLite,
  OrientationRow,
  OrientationValue,
} from "@/features/properties/types/property-domain";

/* =========================================================
   방향 정규화: '', null → '' / E,SE,NE... → 동,남동,북동...
   라벨(동/서/남/북/남동/남서/북동/북서/동서/남북)은 그대로 유지
   ========================================================= */
const CODE_TO_LABEL: Record<string, OrientationValue> = {
  E: "동",
  W: "서",
  S: "남",
  N: "북",
  SE: "남동",
  SW: "남서",
  NE: "북동",
  NW: "북서",
  EW: "동서",
  SN: "남북",
};

function normalizeDir(raw: unknown): OrientationValue | "" {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  // 영문 코드면 라벨로
  if (CODE_TO_LABEL[s]) return CODE_TO_LABEL[s];
  // 이미 라벨이면 그대로(타입 레벨에선 OrientationValue, 런타임에선 느슨히 허용)
  return s as OrientationValue;
}

/** dir이 비어있지 않은 행만 남기고, dir을 OrientationValue(라벨)로 좁혀줌 */
type FilledAspect = { no: number; dir: OrientationValue };
const isFilledAspect = (a: AspectRowLite): a is FilledAspect => {
  const n = normalizeDir(a.dir);
  return !!n;
};

/** aspects(폼 상태) → orientations/legacy 파생값 묶음 */
export function buildOrientationFields(aspects: AspectRowLite[]): {
  orientations: OrientationRow[];
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  aspect?: string;
  aspectNo?: string;
} {
  // 공백/코드 등을 정규화 + 유효 행만
  const cleaned: FilledAspect[] = aspects
    .map((a) => ({ no: a.no, dir: normalizeDir(a.dir) }))
    .filter((a): a is FilledAspect => !!a.dir);

  // ho → value (중복 ho가 있으면 마지막 값이 반영됨)
  const byHo = new Map<number, OrientationValue>(
    cleaned.map((a) => [a.no, a.dir])
  );

  const a1 = byHo.get(1);
  const a2 = byHo.get(2);
  const a3 = byHo.get(3);

  // 정렬은 복사본에서만
  const first = [...cleaned].sort((a, b) => a.no - b.no)[0];
  const legacyAspect = first?.dir;
  const legacyAspectNo = first ? `${first.no}호` : undefined;

  const orientations: OrientationRow[] = cleaned.map((a) => ({
    ho: a.no,
    value: a.dir, // 이미 OrientationValue(라벨)
  }));

  return {
    orientations,
    ...(a1 ? { aspect1: a1 } : {}),
    ...(a2 ? { aspect2: a2 } : {}),
    ...(a3 ? { aspect3: a3 } : {}),
    ...(legacyAspect ? { aspect: legacyAspect } : {}),
    ...(legacyAspectNo ? { aspectNo: legacyAspectNo } : {}),
  };
}

/** 저장된 데이터에서 보기용 배열 생성 (orientations 우선, 없으면 레거시) */
export function toAspectView(
  orientations?: OrientationRow[] | null,
  legacy?: {
    aspect?: string;
    aspectNo?: string;
    aspect1?: string;
    aspect2?: string;
    aspect3?: string;
  }
): AspectRowLite[] {
  // ✅ 최신 구조가 있으면 무조건 우선 사용
  if (orientations?.length) {
    return orientations
      .map((o) => ({
        no: o.ho,
        dir: normalizeDir(o.value),
      }))
      .filter((o): o is { no: number; dir: OrientationValue } => !!o.dir)
      .sort((a, b) => a.no - b.no);
  }

  // ⬇️ 없을 때에만 레거시 필드로 구성
  const arr: AspectRowLite[] = [];
  const l1 = normalizeDir(legacy?.aspect1);
  const l2 = normalizeDir(legacy?.aspect2);
  const l3 = normalizeDir(legacy?.aspect3);
  if (l1) arr.push({ no: 1, dir: l1 });
  if (l2) arr.push({ no: 2, dir: l2 });
  if (l3) arr.push({ no: 3, dir: l3 });

  if (!arr.length) {
    const la = normalizeDir(legacy?.aspect);
    if (la) {
      const n = parseInt(
        String(legacy?.aspectNo ?? "").replace(/\D/g, "") || "1",
        10
      );
      arr.push({
        no: Number.isNaN(n) ? 1 : n,
        dir: la,
      });
    }
  }
  return arr;
}
