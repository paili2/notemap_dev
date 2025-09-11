import { materializeToRefs, hydrateRefsToMedia } from "@/lib/media/refs";
import type { ImageRef } from "@/lib/imageStore";

export async function materializePropertyMedia(
  propertyId: string,
  cards: any[][],
  files: any[]
): Promise<{ cardRefs: ImageRef[][]; fileRefs: ImageRef[] }> {
  return materializeToRefs(`prop:${propertyId}`, cards, files);
}

export const hydratePropertyMedia = hydrateRefsToMedia;
