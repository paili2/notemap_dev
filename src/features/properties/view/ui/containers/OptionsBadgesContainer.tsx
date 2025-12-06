// src/features/properties/view/containers/OptionsBadgesContainer.tsx
"use client";

import OptionsBadges from "../../sections/OptionsBadges";

type OptionsBadgesContainerProps = {
  /** 어댑터/뷰 훅에서 넘어오는 옵션 라벨들 */
  options?: string[] | null;

  /**
   * 뷰 레이어에서 사용하는 기타 옵션 텍스트
   * - 보통 view.optionEtc (서버 extraOptionsText 정규화 결과)
   */
  optionEtc?: string | null;

  /**
   * 서버 raw 에서 직접 넘어온 extraOptionsText 를 그대로 쓰고 싶을 때
   * - OptionsBadges 내부에서 optionEtc 가 없으면 이 값을 사용
   */
  extraOptionsText?: string | null;
};

export default function OptionsBadgesContainer({
  options,
  optionEtc,
  extraOptionsText,
}: OptionsBadgesContainerProps) {
  return (
    <OptionsBadges
      options={options ?? undefined}
      optionEtc={optionEtc ?? undefined}
      extraOptionsText={extraOptionsText ?? undefined}
    />
  );
}
