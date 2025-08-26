import { toPy } from "@/features/properties/lib/area";

export function fmt(d?: string | Date) {
  if (!d) return "-";
  let date: Date | null = null;

  if (typeof d === "string") {
    const try1 = new Date(d);
    if (!isNaN(try1.getTime())) {
      date = try1;
    } else {
      const m = d
        .trim()
        .match(
          /^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?$/
        );
      if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const dd = parseInt(m[3], 10);
        const hh = m[4] ? parseInt(m[4], 10) : 0;
        const mm = m[5] ? parseInt(m[5], 10) : 0;
        date = new Date(y, mo, dd, hh, mm);
      }
    }
  } else {
    date = d;
  }

  if (!date || isNaN(date.getTime())) return typeof d === "string" ? d : "-";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}.${m}.${dd} ${hh}:${mm}`;
}

export function toInputDateString(d?: string | Date) {
  if (!d) return "";
  if (typeof d === "string") return d;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}.${m}.${dd}`;
}

export const parseRange = (s?: string): { min: string; max: string } => {
  const raw = (s || "").trim();
  if (!raw) return { min: "", max: "" };
  if (raw.includes("~")) {
    const [a, b] = raw.split("~");
    return { min: (a || "").trim(), max: (b || "").trim() };
  }
  return { min: raw, max: "" };
};
export const formatRangeWithPy = (s?: string) => {
  const { min, max } = parseRange(s);
  const hasMin = !!min.trim();
  const hasMax = !!max.trim();
  if (!hasMin && !hasMax) return "-";

  const minPy = hasMin ? toPy(min) : "";
  const maxPy = hasMax ? toPy(max) : "";

  if (hasMin && hasMax) return `${min}~${max} m² (${minPy}~${maxPy} 평)`;
  if (hasMin) return `${min}~ m² (${minPy}~ 평)`;
  return `~${max} m² (~${maxPy} 평)`;
};

/* ==== 등급/별점 ==== */
export type Grade = "상" | "중" | "하";
export const gradeToStars = (g?: Grade) =>
  g === "상" ? 5 : g === "중" ? 3 : g === "하" ? 1 : 0;
export const starsToGrade = (n: number): Grade | undefined =>
  n >= 4 ? "상" : n >= 2 ? "중" : n > 0 ? "하" : undefined;

/* ==== 로컬 스토리지 모드 ==== */
const MODE_KEY = "propertyView:mode";
export function loadInitialMode(): "KN" | "R" {
  if (typeof window === "undefined") return "KN";
  const saved = window.localStorage.getItem(MODE_KEY);
  return saved === "R" ? "R" : "KN";
}
export function persistMode(next: "KN" | "R") {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("propertyView:mode", next);
    }
  } catch {}
}

/* ==== 날짜 포맷 ==== */
export function formatDateOnly(dateStr?: string | Date) {
  if (!dateStr) return "-";
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, "0");
    const day = String(dateStr.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }
  return dateStr;
}
