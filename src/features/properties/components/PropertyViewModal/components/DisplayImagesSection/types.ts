import { ImageItem } from "@/features/properties/types/media";

export type AnyImg =
  | ImageItem
  | { [k: string]: any }
  | string
  | null
  | undefined;

export interface DisplayImagesSectionProps {
  cards?: Array<Array<AnyImg>>;
  images?: Array<AnyImg>;
  files?: Array<AnyImg>;
  showNames?: boolean;
}
