import { s } from "./numeric";

export type OptionsForServer = {
  hasAircon?: boolean;
  hasFridge?: boolean;
  hasWasher?: boolean;
  hasDryer?: boolean;
  hasBidet?: boolean;
  hasAirPurifier?: boolean;
  extraOptionsText?: string | null;
};

/** UI 의 options 배열 + 직접입력 → 서버용 options 객체로 변환 */
export function buildOptionsForServer(
  selected: string[],
  etcChecked: boolean,
  optionEtc: string
): OptionsForServer {
  const set = new Set(selected ?? []);
  const etcText = s(optionEtc); // 공백 트림 + "" 처리

  const out: OptionsForServer = {
    hasAircon: set.has("에어컨"),
    hasFridge: set.has("냉장고"),
    hasWasher: set.has("세탁기"),
    hasDryer: set.has("건조기"),
    hasBidet: set.has("비데"),
    hasAirPurifier: set.has("공기순환기"),
  };

  if (etcChecked) {
    // ✅ 직접입력 ON
    // - 글자가 있으면 그 값 그대로
    // - 글자가 없으면 "" 로 명시적으로 보내서 기존 값 삭제 트리거
    out.extraOptionsText = etcText ?? "";
  } else {
    // ✅ 직접입력 OFF
    // - 무조건 "" 로 보내서 DB 값 지우게 만들기
    out.extraOptionsText = "";
  }

  return out;
}
