export interface MemoSectionProps {
  mode: "KN" | "R";
  value: string;
  setValue: (v: string) => void;

  id?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number; // 기본 3
  maxLength?: number; // 지정 시 카운터 표시 가능
  showCount?: boolean; // 기본 true (maxLength 있을 때만)
  autoGrow?: boolean; // 내용에 따라 높이 자동 확장 (기본 false)
  className?: string;
}
