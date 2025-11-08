import { PinSearchParams } from "@/features/pins/types/pin-search";

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
  title: string;
  children: React.ReactNode;
}

export interface SelectableButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}
