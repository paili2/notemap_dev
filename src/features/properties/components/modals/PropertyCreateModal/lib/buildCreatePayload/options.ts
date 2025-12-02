// PropertyCreateModal/lib/buildCreatePayload/options.ts
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
  const etcText = s(optionEtc);

  const out: OptionsForServer = {
    hasAircon: set.has("에어컨"),
    hasFridge: set.has("냉장고"),
    hasWasher: set.has("세탁기"),
    hasDryer: set.has("건조기"),
    hasBidet: set.has("비데"),
    hasAirPurifier: set.has("공기순환기"),
  };

  if (etcChecked && etcText) {
    out.extraOptionsText = etcText;
  }

  return out;
}
