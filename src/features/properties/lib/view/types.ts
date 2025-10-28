import type { ImageItem } from "@/features/properties/types/media";

/** 뷰에 필요한 최소/공통 입력 소스 (느슨한 수용 타입) */
export type ViewSource = {
  /* 공통 메타 (상단 요약 영역) */
  title?: string | null;
  address?: string | null;
  status?: string | null;
  dealStatus?: string | null;
  type?: string | null;
  /** 백엔드가 숫자로 줄 수도 있어 느슨 허용 */
  priceText?: string | number | null;

  /* 서버가 내려주는 view 블록(있으면 사용) */
  view?: Partial<{
    /* 미디어 */
    imageCards: (ImageItem[] | any[])[]; // 카드를 우선 사용 (정규화에서 필터)
    images: (ImageItem | any)[]; // 레거시 단일 배열
    fileItems: (ImageItem | any)[]; // 첨부 파일류

    /* 향/호수 */
    orientations: Array<{ ho: number | string; value: string }>;
    aspectNo?: string | null;
    aspect?: string | null;
    aspect1?: string | null;
    aspect2?: string | null;
    aspect3?: string | null;

    /* 면적 세트 제목 (레거시 키 호환) */
    baseAreaTitle?: string | null;
    areaSetTitle?: string | null;
    areaTitle?: string | null;
    extraAreaTitles?: (string | null)[] | null;
    areaSetTitles?: (string | null)[] | null;

    /* 옵션/라인 */
    options?: (string | null)[] | null;
    optionEtc?: string | null;
    registry?: string | null;
    unitLines?: any[]; // 도메인 타입 있으면 좁혀도 OK

    /* 점수/엘리베이터/주차 */
    listingStars?: number | string | null; // 0~5 (문자/숫자 혼재 대비)
    elevator?: "O" | "X" | string | null; // 비정형 값도 방어
    parkingType?: string | null;
    parkingCount?: string | number | null;

    /* 날짜/면적 */
    completionDate?: string | null;
    exclusiveArea?: number | string | null;
    realArea?: number | string | null;
    extraExclusiveAreas?: (number | null)[] | null;
    extraRealAreas?: (number | null)[] | null;

    /* 수량 정보 */
    totalBuildings?: number | string | null;
    totalFloors?: number | string | null;
    totalHouseholds?: number | string | null;
    remainingHouseholds?: number | string | null;

    /* 등급 */
    slopeGrade?: string | null;
    structureGrade?: string | null;

    /* 메모/작성정보 */
    publicMemo?: string | null;
    secretMemo?: string | null;
    createdByName?: string | null;
    createdAt?: string | null;
    inspectedByName?: string | null;
    inspectedAt?: string | null;
    updatedByName?: string | null;
    updatedAt?: string | null;
  }>;
};
