type Gap = 1 | 2 | 3 | 4;
type Align = "start" | "center" | "end";
type LongLabelMode = "truncate" | "wrap";

export interface FieldProps {
  label: React.ReactNode;
  children: React.ReactNode;

  gap?: Gap;
  /** px 또는 CSS 길이 문자열도 허용 */
  labelWidth?: number | string;
  labelMaxWidth?: number;

  dense?: boolean;
  align?: Align;

  className?: string;
  labelClassName?: string;
  contentClassName?: string;

  noWrapLabel?: boolean;
  longLabelMode?: LongLabelMode;

  /** 접근성: 특정 컨트롤 id에 매칭하려면 전달 */
  htmlFor?: string;
  /** label을 실제 <label>로 렌더링 (htmlFor와 함께 쓰면 좋음) */
  renderAsLabel?: boolean;

  rowMinHeight?: number | string;
}
