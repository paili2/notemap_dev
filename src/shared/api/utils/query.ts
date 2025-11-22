// src/shared/api/utils/query.ts

export function buildSearchQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // 배열 = rooms, buildingTypes (하나만 있어도 무조건 배열로 인식되게)
    if (Array.isArray(value)) {
      let arr = value;

      // ✅ rooms, buildingTypes가 1개일 경우에도 "배열"로 인식되게 2개로 보내기
      if ((key === "rooms" || key === "buildingTypes") && value.length === 1) {
        arr = [value[0], value[0]];
      }

      arr.forEach((v) => {
        if (v === undefined || v === null || v === "") return;
        sp.append(key, String(v));
      });
      return;
    }

    // boolean은 true/false 문자열로
    if (typeof value === "boolean") {
      sp.append(key, value ? "true" : "false");
      return;
    }

    if (value === "") return;

    sp.append(key, String(value));
  });

  return sp.toString();
}
