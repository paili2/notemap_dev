import type {
  PlanRequestPayload,
  ReserveRequestPayload,
  CreateFromPinArgs,
} from "../PinContextMenu/types";

/* ---------------------------------- */
/* Common primitives & utils          */
/* ---------------------------------- */

/** 드래프트(새 위치) 고정 id 상수 */
export const DRAFT_PIN_ID = "__draft__" as const;

/** 드래프트 id 또는 실제 매물 id(문자열/숫자 문자열) */
export type PropertyId = typeof DRAFT_PIN_ID | string;

/** kakao LatLng | POJO 모두 지원하는 좌표 타입 */
export type LatLngLike =
  | kakao.maps.LatLng
  | {
      lat: number;
      lng: number;
    };

/** 드래프트 id 판별 가드 */
export function isDraftId(id: unknown): id is typeof DRAFT_PIN_ID {
  return id === DRAFT_PIN_ID;
}

/** 빈 문자열/공백을 null로 정규화할 때 유용 */
export function normalizeNullableString(v?: string | null): string | null {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

/** 느슨한 불리언 변환 (true/"true"/1/"1") */
export function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

/** 서버 draftState → planned/reserved 매핑 */
export function mapDraftState(s?: string | null) {
  const v = String(s ?? "")
    .trim()
    .toUpperCase();
  const planned = v === "BEFORE" || v === "PENDING" || v === "PLANNED";
  const reserved = v === "SCHEDULED" || v === "RESERVED";
  return { planned, reserved };
}

/** __visit__/__reserved__/__plan__/__planned__ 형태에서 숫자 ID 추출 */
export function extractDraftIdFromPropertyId(
  propertyId?: PropertyId | number | null
): number | undefined {
  if (propertyId == null) return undefined;
  const raw = String(propertyId).trim();
  if (!raw) return undefined;

  const m = raw.match(
    /^(?:__visit__|__reserved__|__plan__|__planned__)(\d+)$/i
  );
  if (m && m[1]) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** kakao LatLng | POJO 모두 지원 */
export function getLatLngFromPosition(pos: LatLngLike) {
  if ("getLat" in pos && typeof pos.getLat === "function") {
    return {
      lat: pos.getLat(),
      lng: pos.getLng(),
    };
  }
  return {
    lat: (pos as any).lat as number,
    lng: (pos as any).lng as number,
  };
}

/** 빈값 / __draft__ / __new__ / 숫자가 아닌 id 는 모두 임시 드래프트 취급 */
export function isDraftLikeId(id?: PropertyId | null): boolean {
  const s = String(id ?? "")
    .trim()
    .toLowerCase();

  // 완전 비어 있으면 드래프트
  if (!s) return true;

  // 우리 쪽 임시 id 패턴들
  if (s === "__draft__" || s === "__new__") return true;

  // 정상 매물 id는 숫자 문자열이라는 가정
  if (!/^\d+$/.test(s)) return true;

  return false;
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
   * - kakao.maps.LatLng 인터페이스 + POJO 모두 지원
   */
  position: LatLngLike;

  /**
   * 지도 컨테이너 DOM (다른 핀 클릭 시 즉시 전환 등에서 포커스/바깥클릭 제어에 사용)
   * - 필요 없으면 생략 가능
   */
  mapContainer?: HTMLElement | null;

  canDelete?: boolean;
  onDelete?: () => void;
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
  position: LatLngLike;

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
  draftState?: string;
  isVisitReservedPin?: boolean;
  isPlanPin?: boolean;
}): "reserved" | "planned" | "draft" | "normal" {
  const { propertyId, draftState, isVisitReservedPin, isPlanPin } = flags;

  const idStr = String(propertyId ?? "").trim();
  const idLow = idStr.toLowerCase();

  const byState = mapDraftState(draftState);
  const reservedByState = byState.reserved;
  const plannedByState = byState.planned;

  const reservedByProp = asBool(isVisitReservedPin);
  const plannedByProp = asBool(isPlanPin);

  const reservedById =
    /(^|[_:. -])(visit|reserved|reserve|rsvd)([_:. -]|$)/i.test(idStr) ||
    idLow.startsWith("__visit__") ||
    idLow.startsWith("__reserved__");

  const plannedById =
    /(^|[_:. -])(plan|planned|planning|previsit)([_:. -]|$)/i.test(idStr) ||
    idLow.startsWith("__plan__") ||
    idLow.startsWith("__planned__");

  const reserved = reservedByState || reservedByProp || reservedById;
  const planned = !reserved && (plannedByState || plannedByProp || plannedById);

  const draftLike = isDraftLikeId(propertyId);
  const draft = !reserved && !planned && draftLike;

  if (reserved) return "reserved";
  if (planned) return "planned";
  if (draft) return "draft";
  return "normal";
}

/** 패널 헤더 타이틀 생성 규칙 */
export function computeHeaderTitle(args: {
  panelState: "reserved" | "planned" | "draft" | "normal";
  displayTitle?: string | null;
  propertyTitle?: string | null;
  roadAddress?: string | null;
  jibunAddress?: string | null;
}) {
  const { panelState, displayTitle, propertyTitle, roadAddress, jibunAddress } =
    args;

  if (panelState === "draft") return "선택 위치";

  const name =
    normalizeNullableString(displayTitle) ??
    normalizeNullableString(propertyTitle);

  if (name) return name;

  if (panelState === "reserved") return "답사지예약";

  if (panelState === "planned") {
    const addr =
      normalizeNullableString(roadAddress) ??
      normalizeNullableString(jibunAddress);
    if (addr) return addr;
    return "답사예정";
  }

  return "선택 위치";
}
