// "use client";

// import type { ComponentType } from "react";
// import { Train, Coffee, Store, Pill, Bus } from "lucide-react";
// import { renderToStaticMarkup } from "react-dom/server";

// /** POI 종류 */
// export type PoiKind = "convenience" | "cafe" | "pharmacy" | "subway";

// /** 카카오 카테고리 코드 매핑 */
// export const KAKAO_CATEGORY: Record<PoiKind, string> = {
//   convenience: "CS2", // 편의점
//   cafe: "CE7", // 카페
//   pharmacy: "PM9", // 약국
//   subway: "SW8", // 지하철역
// };

// /** 라벨 텍스트 매핑 */
// export const POI_LABEL: Record<PoiKind, string> = {
//   convenience: "편의점",
//   cafe: "카페",
//   pharmacy: "약국",
//   subway: "지하철역",
// };

// /** 원형 배경 + lucide 아이콘을 조합해 data URL(SVG) 생성 */
// const lucideDataUrl = (Icon: ComponentType<any>, bg: string) => {
//   const iconSvg = renderToStaticMarkup(
//     <Icon size={24} stroke="#fff" strokeWidth={2.25} />
//   );
//   // 바깥 <svg> 래퍼 제거 후 중앙 배치
//   const inner = iconSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
//   const svg = `
//     <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'>
//       <circle cx='24' cy='24' r='20' fill='${bg}' />
//       <g transform='translate(12,12)'>
//         ${inner}
//       </g>
//     </svg>
//   `;
//   return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
// };

// /** 지도 마커 아이콘 (data URL) */
// export const POI_ICON = {
//   convenience: lucideDataUrl(Store, "#10b981"), // 편의점
//   cafe: lucideDataUrl(Coffee, "#f59e0b"), // 카페
//   pharmacy: lucideDataUrl(Pill, "#ef4444"), // 약국
//   subway: lucideDataUrl(Train, "#3b82f6"), // 지하철
//   // 추가 키 (PoiKind에는 없지만 필요 시 사용)
//   busstop: lucideDataUrl(Bus, "#0ea5e9"), // 버스정류장
// } as const satisfies Record<PoiKind, string> & { busstop: string };
