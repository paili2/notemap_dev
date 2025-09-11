export const makeNewImgKey = (scope: "card" | "vertical") =>
  `prop:new:${scope}:${crypto.randomUUID()}`;

export const makeImgKey = (propertyId: string, scope: "card" | "vertical") =>
  `prop:${propertyId}:${scope}:${crypto.randomUUID()}`;
