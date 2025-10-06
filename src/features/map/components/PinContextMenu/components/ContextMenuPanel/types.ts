export type ContextMenuPanelProps = {
  roadAddress?: string | null;
  jibunAddress?: string | null;
  /** "__draft__" 또는 실제 id(숫자/문자열) */
  propertyId?: string | null;
  /** 매물명 (선택) */
  propertyTitle?: string | null;

  /** plan(답사예정/임시) 핀인지 부모에서 판단해 넘겨줄 수 있음 */
  isDraftPin?: boolean;
  isPlanPin?: boolean;
  /** ✅ reserved(답사지예약 완료) 플래그: 컨테이너에서 명시 전달 */
  isVisitReservedPin?: boolean;

  /** 즐겨찾기 버튼 노출 여부(부모에서 결정: 매물 등록된 핀에서만 true) */
  showFav?: boolean;
  favActive?: boolean;
  onAddFav: () => void;

  /** 공통 콜백들 */
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
  onPlan?: () => void;

  /** ✅ 지도 컨테이너 DOM (다른 핀 클릭시 즉시 전환용) */
  mapContainer?: HTMLElement | null;
};
