export type PoiKind = "convenience" | "cafe" | "pharmacy" | "subway";

export const KAKAO_CATEGORY: Record<Exclude<PoiKind, "busstop">, string> = {
  convenience: "CS2", // 편의점
  cafe: "CE7", // 카페
  pharmacy: "PM9", // 약국
  subway: "SW8", // 지하철역
};

export const POI_LABEL: Record<PoiKind, string> = {
  convenience: "편의점",
  cafe: "카페",
  pharmacy: "약국",
  subway: "지하철역",
};

const circleLabel = (bg: string, text: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'>
       <circle cx='24' cy='24' r='20' fill='${bg}' />
       <text x='24' y='29' font-size='18' text-anchor='middle' fill='#fff' font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif' font-weight='700'>${text}</text>
     </svg>`
  );

export const POI_ICON = {
  convenience: circleLabel("#10b981", "24"), // 편의점
  cafe: circleLabel("#f59e0b", "☕"), // 카페
  pharmacy: circleLabel("#ef4444", "약"), // 약국
  subway: circleLabel("#3b82f6", "S"), // 지하철
  busstop: circleLabel("#0ea5e9", "B"), // 버스
} as const;
