import type {
  OrientationRow,
  OrientationValue,
} from "@/features/properties/types/property-domain";

export type AspectRowLite = { no: number; dir: string };

/** aspects(폼 상태) → orientations/legacy 파생값 묶음 */
export function buildOrientationFields(aspects: AspectRowLite[]): {
  orientations: OrientationRow[];
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  aspect?: string;
  aspectNo?: string;
} {
  // 공백 제거 + 유효 행
  const cleaned = aspects
    .filter((a) => a.dir?.trim().length > 0)
    .map((a) => ({ no: a.no, dir: a.dir.trim() }));

  // ho → value
  const byHo = new Map<number, string>(cleaned.map((a) => [a.no, a.dir]));

  const a1 = byHo.get(1);
  const a2 = byHo.get(2);
  const a3 = byHo.get(3);

  const first = cleaned.sort((a, b) => a.no - b.no)[0];
  const legacyAspect = first?.dir;
  const legacyAspectNo = first ? `${first.no}호` : undefined;

  const orientations: OrientationRow[] = cleaned.map((a) => ({
    ho: a.no,
    value: a.dir as OrientationValue,
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
) {
  if (orientations?.length) {
    return orientations
      .slice()
      .sort((a, b) => a.ho - b.ho)
      .map((o) => ({ no: o.ho, dir: o.value }));
  }
  const arr: { no: number; dir: string }[] = [];
  if (legacy?.aspect1) arr.push({ no: 1, dir: legacy.aspect1 });
  if (legacy?.aspect2) arr.push({ no: 2, dir: legacy.aspect2 });
  if (legacy?.aspect3) arr.push({ no: 3, dir: legacy.aspect3 });
  if (!arr.length && legacy?.aspect) {
    const n = parseInt(
      String(legacy.aspectNo ?? "").replace(/\D/g, "") || "1",
      10
    );
    arr.push({ no: Number.isNaN(n) ? 1 : n, dir: legacy.aspect });
  }
  return arr;
}
