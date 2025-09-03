import type {
  DealStatus,
  Grade,
  Registry,
  UnitLine,
  Visibility,
  OrientationValue,
} from "@/features/properties/types/property-domain";

import type {
  CreatePayload,
  UpdatePayload,
} from "@/features/properties/types/property-dto";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/property-view";
import { AreaSet } from "../sections/AreaSetsSection/types";

export type PropertyEditModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (
    payload: UpdatePayload & Partial<CreatePayload>
  ) => void | Promise<void>;
  initialData: PropertyViewDetails;
};

export type PropertyEditItem = {
  id: string;

  title?: string;
  address?: string;

  officePhone?: string;
  officePhone2?: string;
  officeName?: string;

  moveIn?: string;
  floor?: string;
  roomNo?: string;
  structure?: string;

  /** 생성/수정 공통 포맷 (간단 배열) */
  aspects?: { no: number; dir: OrientationValue | "" }[];
  listingStars?: number;

  parkingType?: string | null;
  parkingCount?: string | number | null;

  completionDate?: string | Date | null;
  salePrice?: string | number | null;

  /** "a~b" 문자열 포맷 */
  exclusiveArea?: string | null;
  realArea?: string | null;
  extraExclusiveAreas?: string[]; // 각 항목 "a~b"
  extraRealAreas?: string[]; // 각 항목 "a~b"

  /** 편집용 UI 상태(선택) */
  baseAreaSet?: AreaSet;
  extraAreaSets?: AreaSet[];

  elevator?: "O" | "X";
  registry?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  totalBuildings?: string;
  totalFloors?: string;
  totalHouseholds?: string;
  remainingHouseholds?: string;

  options?: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;

  status?: Visibility;
  dealStatus?: DealStatus;

  unitLines?: UnitLine[];
  images?: string[];
};
