export interface OptionsSectionProps {
  PRESET_OPTIONS: readonly string[];

  /** 체크박스로 선택된 옵션들 */
  options?: string[];
  setOptions?: (next: string[]) => void;

  /** "직접입력" 체크박스 상태 */
  etcChecked: boolean;
  setEtcChecked?: (v: boolean) => void;

  /** ✅ 기타 옵션(자유 텍스트) 문자열 */
  optionEtc?: string;
  setOptionEtc?: (v: string) => void;
}
