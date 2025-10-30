import type {
  PlanRequestPayload,
  ReserveRequestPayload,
  CreateFromPinArgs,
} from "../PinContextMenu/types";

/* ---------------------------------- */
/* Common primitives & utils          */
/* ---------------------------------- */

/** 드래프트(새 위치) 고정 id 상수 */
const DRAFT_PIN_ID = "__draft__" as const;

/** 드래프트 id 또는 실제 매물 id(문자열/숫자 문자열) */
type PropertyId = typeof DRAFT_PIN_ID | string;

/** 드래프트 id 판별 가드 */
function isDraftId(id: unknown): id is typeof DRAFT_PIN_ID {
  return id === DRAFT_PIN_ID;
}

/** 빈 문자열/공백을 null로 정규화할 때 유용 */
function normalizeNullableString(v?: string | null): string | null {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

/* ---------------------------------- */
/* PlanPayload (컨테이너-패널 교신용)  */
/* ---------------------------------- */

/**
 * 패널에서 컨테이너로 전달하는 답사예정/예약 관련 페이로드
 * - 컨테이너가 위경도/주소/초기 날짜/임시 생성 여부 등을 완성시켜 사용
 */
export type PlanPayload = {
  /** 위치(context) */
  lat?: number;
  lng?: number;
  /** 주소(context) */
  address?: string;
  roadAddress?: string | null;
  jibunAddress?: string | null;

  /** 매물 식별자: 드래프트("__draft__") 또는 실제 id */
  propertyId?: PropertyId | null;
  /** 매물 명칭(선택) */
  propertyTitle?: string | null;

  /** ISO yyyy-mm-dd */
  dateISO?: string;

  /** 컨테이너에게 드래프트 생성 힌트 */
  createDraft?: boolean;

  /** 예약 트리거 힌트(호출부 플래그 호환) */
  reserve?: boolean;

  /** 사전 생성된 드래프트 id(있다면) */
  draftId?: string;
};

/* ---------------------------------- */
/* Panel props (호환 버전)            */
/* ---------------------------------- */

export type ContextMenuPanelProps = {
  /* 주소 */
  roadAddress?: string | null;
  jibunAddress?: string | null;

  /** "__draft__" | 실제 id(문자열) | null */
  propertyId?: PropertyId | null;
  /** 매물명(선택) */
  propertyTitle?: string | null;

  /** 서버 드래프트 상태(raw) */
  draftState?: string;

  /**
   * 핀 상태 플래그
   * - isDraftPin: 지도에서 막 찍은 임시(답사예정候補)
   * - isPlanPin: 답사예정 상태 핀
   * - isVisitReservedPin: 답사지 예약 완료 핀
   *
   * @note 우선순위: reserved > planned > draft > normal
   */
  isDraftPin?: boolean;
  isPlanPin?: boolean;
  isVisitReservedPin?: boolean;

  /** 즐겨찾기 UI */
  showFav?: boolean;
  favActive?: boolean;
  onAddFav: () => void;

  /** 공통 콜백 */
  onClose: () => void;
  onView: (id: string) => void;

  /**
   * ✅ 신규 등록/정보 입력 트리거
   * - 전역 타입(CreateFromPinArgs)으로 통일
   * - 패널에서 좌표/드래프트 id/주소 힌트를 채워 전달
   */
  onCreate?: (payload: CreateFromPinArgs) => void;

  /** 컨테이너가 필요 필드를 보강하여 사용 */
  onPlan?: (opts?: Partial<PlanRequestPayload>) => void | Promise<void>;

  /** 예약 처리(컨테이너에서 실제 처리) */
  onReserve?: (payload?: ReserveRequestPayload) => void | Promise<void>;

  /**
   * ✅ 패널 내부에서 좌표가 필요하므로 컨테이너에서 내려준다
   * - kakao.maps.LatLng 인터페이스 사용 (getLat/getLng)
   */
  position: kakao.maps.LatLng;

  /**
   * 지도 컨테이너 DOM (다른 핀 클릭 시 즉시 전환 등에서 포커스/바깥클릭 제어에 사용)
   * - 필요 없으면 생략 가능
   */
  mapContainer?: HTMLElement | null;
};

/* ---------------------------------- */
/* Optional: Strict discriminated props
/*  - 필요 시 점진 도입. 기존과 100% 호환 유지 위해 별도 export */
/* ---------------------------------- */

type BasePanelProps = {
  roadAddress?: string | null;
  jibunAddress?: string | null;
  propertyTitle?: string | null;

  showFav?: boolean;
  favActive?: boolean;
  onAddFav: () => void;

  onClose: () => void;
  onView: (id: string) => void;

  /** 신규 등록 */
  onCreate?: (payload: CreateFromPinArgs) => void;

  /** 예정/예약 */
  onPlan?: (opts?: Partial<PlanRequestPayload>) => void | Promise<void>;
  onReserve?: (payload?: ReserveRequestPayload) => void | Promise<void>;

  /** ✅ strict 모드에도 동일하게 position 필요 */
  position: kakao.maps.LatLng;

  mapContainer?: HTMLElement | null;
};

type ReservedPanelProps = BasePanelProps & {
  state: "reserved";
  propertyId: Exclude<PropertyId, typeof DRAFT_PIN_ID>;
};

type PlannedPanelProps = BasePanelProps & {
  state: "planned";
  propertyId: Exclude<PropertyId, typeof DRAFT_PIN_ID>;
};

type DraftPanelProps = BasePanelProps & {
  state: "draft";
  propertyId: typeof DRAFT_PIN_ID;
};

type NormalPanelProps = BasePanelProps & {
  state: "normal";
  /** 정상 매물 id 필요(상세보기 동작 보장) */
  propertyId: Exclude<PropertyId, typeof DRAFT_PIN_ID>;
};

/**
 * 엄격 모드: 한 번에 하나의 상태만 허용(컴파일 타임 보장)
 * - 사용 예)
 *   <ContextMenuPanelStrict props={... as ReservedPanelProps} />
 */
export type ContextMenuPanelPropsStrict =
  | ReservedPanelProps
  | PlannedPanelProps
  | DraftPanelProps
  | NormalPanelProps;

/* ---------------------------------- */
/* 상태 유도 헬퍼 (UI 로직에서 재사용) */
/* ---------------------------------- */

/** 패널 상태 우선순위 결정: reserved > planned > draft > normal */
export function computePanelState(flags: {
  propertyId?: PropertyId | null;
  isVisitReservedPin?: boolean;
  isPlanPin?: boolean;
}): "reserved" | "planned" | "draft" | "normal" {
  const { propertyId, isVisitReservedPin, isPlanPin } = flags;
  if (isVisitReservedPin) return "reserved";
  if (!isVisitReservedPin && isPlanPin && !isDraftId(propertyId ?? null))
    return "planned";
  if (isDraftId(propertyId ?? null)) return "draft";
  return "normal";
}

/** 패널 헤더 타이틀 생성 규칙 */
export function getHeaderTitle(
  propertyId?: PropertyId | null,
  propertyTitle?: string | null
) {
  if (isDraftId(propertyId ?? null)) return "선택 위치";
  return normalizeNullableString(propertyTitle) ?? "선택된 매물";
}
