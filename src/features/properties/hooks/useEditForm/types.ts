import {
  BuildingType,
  Grade,
  UnitLine,
  OrientationRow, // ✅ buildOrientation 반환에 필요
} from "../../types/property-domain";
import type { AreaSet } from "../../components/sections/AreaSetsSection/types";

/* ───────── 슬라이스 타입들 ───────── */
export type AreaSetsFormSlice = {
  /** 기본 면적 범위 */
  baseAreaSet: AreaSet;
  setBaseAreaSet: (v: AreaSet) => void;

  /** 추가 면적 그룹들 */
  extraAreaSets: AreaSet[];
  setExtraAreaSets: (v: AreaSet[]) => void;

  /**
   * 레거시·서버 호환을 위해 단일값/타이틀을 패키징해서 반환
   * (PropertyEditModalBody.save 에서 사용)
   */
  packAreas: () => {
    exclusiveArea?: string | null;
    realArea?: string | null;
    extraExclusiveAreas?: string[];
    extraRealAreas?: string[];
    baseAreaTitleOut?: string | null;
    extraAreaTitlesOut?: string[];
  };
};

export type AspectsFormSlice = {
  /** UI 내부 상태(필요 시) */
  aspects: any[];
  addAspect: (payload?: any) => void;
  removeAspect: (index: number) => void;
  setAspectDir: (index: number, dir: any) => void;

  /**
   * 서버 패치와 로컬 뷰 갱신 모두에서 쓰는 빌더
   * (PropertyEditModalBody.save 에서 호출)
   */
  buildOrientation: () => {
    orientations?: OrientationRow[];
    aspect?: string;
    aspectNo?: string | number | null;
    aspect1?: string;
    aspect2?: string;
    aspect3?: string;
  };
};

export type BasicInfoFormSlice = {
  address: string;
  setAddress: (v: string) => void;

  officePhone: string;
  setOfficePhone: (v: string) => void;

  officePhone2?: string;
  setOfficePhone2: (v: string) => void;
};

/** ✅ registryOne 제거, buildingType 기반으로 단순화 */
export type CompletionRegistryFormSlice = {
  completionDate: string;
  setCompletionDate: (v: string) => void;

  /** 레거시 최저실입(예전 필드) – 그대로 유지 */
  salePrice: string | number | null;
  setSalePrice: (v: string | number | null) => void;

  /** ✅ 신규: 최저 실입(정수, 만원 단위) */
  minRealMoveInCost: number | string | null;
  setMinRealMoveInCost: (v: number | string | null) => void;

  slopeGrade?: Grade;
  setSlopeGrade: (v?: Grade) => void;

  structureGrade?: Grade;
  setStructureGrade: (v?: Grade) => void;

  /** 서버 enum (건물유형) */
  buildingType: BuildingType | null;
  setBuildingType: (v: BuildingType | null) => void;

  /** ✅ 엘리베이터 O/X ("O" | "X" | null 정도로 사용) */
  elevator: "O" | "X" | null;
  setElevator: (v: "O" | "X" | null) => void;
};

export type MemoFormSlice = {
  publicMemo: string;
  setPublicMemo: (v: string) => void;
  secretMemo: string;
  setSecretMemo: (v: string) => void;
};

export type NumbersFormSlice = {
  totalBuildings: string;
  setTotalBuildings: (v: string) => void;

  totalFloors: string;
  setTotalFloors: (v: string) => void;

  totalHouseholds: string;
  setTotalHouseholds: (v: string) => void;

  remainingHouseholds: string;
  setRemainingHouseholds: (v: string) => void;
};

export type OptionsFormSlice = {
  options: string[];
  setOptions: (v: string[]) => void;

  etcChecked: boolean;
  setEtcChecked: (v: boolean) => void;

  optionEtc: string;
  setOptionEtc: (v: string) => void;
};

export type StructureLinesFormSlice = {
  unitLines: UnitLine[];

  /** 프리셋에서 한 줄 추가 (섹션이 넘겨주는 key/id 형태에 맞추세요) */
  addLineFromPreset: (presetKey: string) => void;

  /** 빈 줄 추가 */
  addEmptyLine: () => void;

  /** 특정 라인 업데이트 (index는 섹션에서 전달받는 기준에 맞추세요) */
  updateLine: (index: number, patch: Partial<UnitLine>) => void;

  /** 특정 라인 제거 */
  removeLine: (index: number) => void;
};

/* ───────── 통합 API ───────── */
export type EditFormAPI = AreaSetsFormSlice &
  AspectsFormSlice &
  BasicInfoFormSlice &
  MemoFormSlice &
  NumbersFormSlice &
  OptionsFormSlice &
  StructureLinesFormSlice;
