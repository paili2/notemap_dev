export type MapQuickControlsProps = {
  isDistrictOn: boolean;
  /** 토글 후 상태를 전달합니다. 예: onToggleDistrict(!isDistrictOn) */
  onToggleDistrict: (next: boolean) => void;

  /** 상단 여백(px). 기본 12 */
  offsetTopPx?: number;
  /** 우측 여백(px). 기본 12 */
  offsetRightPx?: number;

  /** 컨트롤 레이어 z-index. 기본 11000 */
  zIndex?: number;

  /** 추가 스타일/클래스 */
  className?: string;
  style?: React.CSSProperties;

  /** 테스트 편의용 */
  dataTestId?: string;
};
