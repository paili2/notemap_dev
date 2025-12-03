export function looksLikeImageRef(v: any): boolean {
  if (!v || typeof v !== "object") return false;
  return (
    typeof (v as any).url === "string" ||
    typeof (v as any).idbKey === "string" ||
    typeof (v as any).id === "number" ||
    typeof (v as any).id === "string"
  );
}
