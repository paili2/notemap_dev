import type { ImageRef } from "@/lib/imageStore";

export function isHttpLike(s?: unknown): s is string {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}
export function isDataLike(s?: unknown): s is string {
  return typeof s === "string" && s.startsWith("data:");
}
export function isBlobLike(s?: unknown): s is string {
  return typeof s === "string" && s.startsWith("blob:");
}
export function isImageRefLike(v?: unknown): v is ImageRef {
  return (
    !!v &&
    typeof v === "object" &&
    "idbKey" in v &&
    typeof (v as any).idbKey === "string"
  );
}
