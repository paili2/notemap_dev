export interface OptionsSectionProps {
  PRESET_OPTIONS: readonly string[];
  options?: string[];
  setOptions?: (next: string[]) => void;
  etcChecked: boolean;
  setEtcChecked?: (v: boolean) => void;
  optionEtc?: string;
  setOptionEtc?: (v: string) => void;
}
