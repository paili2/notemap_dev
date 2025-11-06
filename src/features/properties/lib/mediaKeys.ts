// ✅ 항상 scope를 명시적으로 사용하고, 구분자도 일관되게
export const makeNewImgKey = (scope: "card" | "vertical") =>
  `prop:new:${scope}:${crypto.randomUUID()}`;

/**
 * propertyId 단위로 이미지 구분
 * scope는 "card" | "vertical" 중 하나여야 함
 * 세로 이미지가 가로로 잘못 표시되는 걸 막기 위해 key에 scope 포함
 */
export const makeImgKey = (propertyId: string, scope: "card" | "vertical") => {
  const safeScope = scope === "vertical" ? "vertical" : "card";
  return `prop:${propertyId}:${safeScope}:${crypto.randomUUID()}`;
};
