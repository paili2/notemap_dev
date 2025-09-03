import {
  AspectRowLite,
  OrientationValue,
} from "@/features/properties/types/property-domain";

export interface AspectsSectionProps {
  aspects: AspectRowLite[];
  addAspect: () => void;
  removeAspect: (no: number) => void;
  setAspectDir: (no: number, dir: OrientationValue | "") => void;
}
