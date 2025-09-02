export type AreaSet = {
  title: string;
  exMinM2: string;
  exMaxM2: string;
  exMinPy: string;
  exMaxPy: string;
  realMinM2: string;
  realMaxM2: string;
  realMinPy: string;
  realMaxPy: string;
};

export interface AreaSetsSectionProps {
  baseAreaSet: AreaSet;
  setBaseAreaSet: (next: AreaSet) => void;

  extraAreaSets: AreaSet[];
  setExtraAreaSets: (next: AreaSet[]) => void;
}
