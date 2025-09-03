import { PRESETS } from "./constants";

export interface ParkingSectionProps {
  parkingType: string;
  setParkingType: (v: string) => void;
  parkingCount: string; // 총 주차대수
  setParkingCount: (v: string) => void;
}

export type Preset = (typeof PRESETS)[number];
