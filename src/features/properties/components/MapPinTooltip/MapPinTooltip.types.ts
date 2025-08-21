export type MapPinTooltipMode = "hover" | "click";

export interface MapPinTooltipProps {
  mode?: MapPinTooltipMode;
  trigger: React.ReactNode;
  thumbnailUrl?: string;
  title: string;
  priceText?: string;
  status?: "available" | "pending" | "sold" | string;
  address?: string;
  distanceText?: string;
  tags?: string[];
  favorite?: boolean;
  onClickView?: () => void;
  onToggleFavorite?: (next: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}
