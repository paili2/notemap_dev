// features/map/pins.ts
export type PinKind =
  | "1room"
  | "1room-terrace"
  | "2room"
  | "2room-terrace"
  | "3room"
  | "3room-terrace"
  | "4room"
  | "4room-terrace"
  | "duplex" // 복층
  | "townhouse" // 타운하우스
  | "oldhouse" // 구옥
  | "question" // 답사예정
  | "completed"; // 완료

// ✅ 네가 지정한 색 (white는 #ffffff로 표준화)
export const PIN_ACCENTS: Record<PinKind, string> = {
  "1room": "#ffffff",
  "1room-terrace": "#ffffff",
  "2room": "#4caf50",
  "2room-terrace": "#4caf50",
  "3room": "#ffd602",
  "3room-terrace": "#ffd602",
  "4room": "#9c27b0",
  "4room-terrace": "#9c27b0",
  duplex: "#ff68b5",
  townhouse: "#7f7f7f",
  oldhouse: "#2196f3",
  question: "#ffffff",
  completed: "#448d46",
};

// 핀 이미지 경로
export function getPinUrl(kind: PinKind) {
  return `/pins/${kind}-pin.svg`;
}
