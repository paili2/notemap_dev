import type { ReactNode } from "react";
import type { PinSearchParams } from "@/features/pins/types/pin-search";

export interface FilterState {
  rooms: string[];
  deposit: string;
  areaMin: string;
  areaMax: string;
  buildingType: string;
  elevator: string;
  priceMin: string;
  priceMax: string;
}

export interface FilterSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (params: PinSearchParams) => void;
  onClear?: () => void;
  initial?: Partial<FilterState>;
}

export interface FilterSectionProps {
  title: ReactNode; // string -> ReactNode 로 변경
  children: ReactNode;
}

export interface SelectableButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}
