import {
  BuildingType,
  Grade,
  Registry,
  UnitLine,
} from "../../types/property-domain";

/* ───────── 슬라이스 타입들 ───────── */
export type AreaSetsFormSlice = {
  baseAreaSet: any;
  setBaseAreaSet: (v: any) => void;
  extraAreaSets: any[];
  setExtraAreaSets: (v: any[]) => void;
};

export type AspectsFormSlice = {
  aspects: any[];
  addAspect: (payload?: any) => void;
  removeAspect: (index: number) => void;
  setAspectDir: (index: number, dir: any) => void;
};

export type BasicInfoFormSlice = {
  address: string;
  setAddress: (v: string) => void;

  officePhone: string;
  setOfficePhone: (v: string) => void;

  officePhone2?: string;
  setOfficePhone2: (v: string) => void;
};

export type CompletionRegistryFormSlice = {
  completionDate: string;
  setCompletionDate: (v: string) => void;

  salePrice: string;
  setSalePrice: (v: string) => void;

  registryOne?: Registry;
  setRegistryOne: (v?: Registry) => void;

  slopeGrade?: Grade;
  setSlopeGrade: (v?: Grade) => void;

  structureGrade?: Grade;
  setStructureGrade: (v?: Grade) => void;

  buildingType: BuildingType | null;
  setBuildingType: (v: BuildingType | null) => void;
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
  CompletionRegistryFormSlice &
  MemoFormSlice &
  NumbersFormSlice &
  OptionsFormSlice &
  StructureLinesFormSlice;
