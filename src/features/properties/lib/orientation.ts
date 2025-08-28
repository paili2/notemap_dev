import type {
  AspectRowLite,
  OrientationRow,
  OrientationValue,
} from "@/features/properties/types/property-domain";

/** dir이 비어있지 않은 행만 남기고, dir을 OrientationValue로 좁혀줌 */
type FilledAspect = { no: number; dir: OrientationValue };
const isFilledAspect = (a: AspectRowLite): a is FilledAspect =>
  typeof a.dir === "string" && a.dir.trim().length > 0;

/** aspects(폼 상태) → orientations/legacy 파생값 묶음 */
export function buildOrientationFields(aspects: AspectRowLite[]): {
  orientations: OrientationRow[];
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  aspect?: string;
  aspectNo?: string;
} {
  // 공백 제거 + 유효 행만 (여기서 타입을 좁혀줌)
  const cleaned: FilledAspect[] = aspects
    .filter(isFilledAspect)
    .map((a) => ({ no: a.no, dir: a.dir.trim() as OrientationValue }));

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
    value: a.dir, // 이미 OrientationValue로 좁혀져 있어서 안전
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
  if (orientations?.length) {
    return orientations
      .filter((o) => !!o.value && String(o.value).trim().length > 0) // 빈값 방지
      .slice()
      .sort((a, b) => a.ho - b.ho)
      .map((o) => ({ no: o.ho, dir: o.value as OrientationValue }));
  }
  const arr: AspectRowLite[] = [];
  if (legacy?.aspect1)
    arr.push({ no: 1, dir: legacy.aspect1 as OrientationValue });
  if (legacy?.aspect2)
    arr.push({ no: 2, dir: legacy.aspect2 as OrientationValue });
  if (legacy?.aspect3)
    arr.push({ no: 3, dir: legacy.aspect3 as OrientationValue });
  if (!arr.length && legacy?.aspect) {
    const n = parseInt(
      String(legacy.aspectNo ?? "").replace(/\D/g, "") || "1",
      10
    );
    arr.push({
      no: Number.isNaN(n) ? 1 : n,
      dir: legacy.aspect as OrientationValue,
    });
  }
  return arr;
}
