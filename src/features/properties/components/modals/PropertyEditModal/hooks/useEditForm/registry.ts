export type RegistryUi = "주택" | "APT" | "OP" | "도/생" | "근/생" | undefined;

/** 서버 buildingType / registry 문자열 → UI 용도 표기 (도/생/근생 라벨 포함) */
export const toUIRegistryFromBuildingType = (v: any): RegistryUi => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!s) return undefined;
  if (["apt", "아파트"].includes(s)) return "APT";
  if (["op", "officetel", "오피스텔"].includes(s)) return "OP";
  if (["주택", "house", "housing", "residential"].includes(s)) return "주택";
  if (
    ["도/생", "도생", "도시생활형", "도시생활형주택", "urban", "urb"].includes(
      s
    )
  )
    return "도/생";
  if (["근생", "근/생", "근린생활시설", "nearlife", "commercial"].includes(s))
    return "근/생";
  return undefined;
};

/** registry / buildingType 원본들에서 최종 UI Registry 값을 계산 */
export const resolveRegistryUi = (opts: {
  registryRaw?: unknown;
  buildingTypeRaw?: unknown;
}): RegistryUi => {
  const { registryRaw, buildingTypeRaw } = opts;

  // ✅ 1순위: buildingType 기반 해석 (실제 저장되는 서버 enum)
  const fromBT = toUIRegistryFromBuildingType(buildingTypeRaw);
  if (fromBT) return fromBT;

  // ✅ 2순위: registry 문자열(레거시/리스트 데이터 등)
  const fromRegistry = toUIRegistryFromBuildingType(registryRaw);
  if (fromRegistry) return fromRegistry;

  return undefined;
};
