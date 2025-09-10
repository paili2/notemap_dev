export interface FilterState {
  rooms: string[];
  deposit: string;
  areaMin: string;
  areaMax: string;
  buildingType: string[];
  elevator: string;
  priceMin: string;
  priceMax: string;
}

export interface FilterSearchProps {
  isOpen: boolean;
  onClose: () => void;
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
