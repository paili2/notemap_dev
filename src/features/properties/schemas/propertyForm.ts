// src/features/properties/schemas/propertyForm.ts
import { z } from "zod";

/* ────────────────────────────────────────────────────────────
 * Zod helpers
 * ──────────────────────────────────────────────────────────── */

const toNullIfEmpty = (v: unknown) => (v === "" ? null : v);

/** 숫자 또는 null 로 정규화(빈 문자열 → null, 정수화, 음수 불가) */
export const asIntOrNull = z.preprocess((v) => {
  v = toNullIfEmpty(v);
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : v; // 숫자 아니면 그대로 두어 zod가 에러로 잡게
}, z.number().int().nonnegative().nullable());

/** 별점("", "1"~"5") 정규화:
 * - 숫자 0 → "" (미선택)
 * - 숫자 1~5 → "1"~"5"
 * - 문자열 공백 → ""
 * - 그 외는 오류
 */
export const asStarStr = z.preprocess((v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") {
    if (v === 0) return "";
    if (Number.isFinite(v) && v >= 1 && v <= 5) return String(Math.trunc(v));
    return v; // zod가 에러 처리
  }
  const s = String(v).trim();
  if (s === "" || s === "0") return "";
  return s;
}, z.union([z.literal(""), z.literal("1"), z.literal("2"), z.literal("3"), z.literal("4"), z.literal("5")]));

/* ────────────────────────────────────────────────────────────
 * Phone helpers (KR)
 * ──────────────────────────────────────────────────────────── */

const normalizePhone = (v: string) => v.replace(/[^\d]/g, "");

const isValidPhoneKR = (raw: string) => {
  const v = normalizePhone(raw);
  // 전체 10~11자리, 02는 9~10자리 허용
  if (!/^0\d{9,10}$/.test(v)) return false;
  if (v.startsWith("02")) return v.length === 9 || v.length === 10;
  return v.length === 10 || v.length === 11;
};

/** 필수 + 형식 검증. 형식이 아니면 "전화번호를 입력해주세요" 표출 */
export const phoneSchemaKR = z
  .string()
  .trim()
  .min(1, "전화번호를 입력해주세요")
  .refine((v) => isValidPhoneKR(v), { message: "전화번호를 입력해주세요" });

/* ────────────────────────────────────────────────────────────
 * Unit line schema (UI 전용 → build 단계에서 서버 DTO로 매핑)
 * ──────────────────────────────────────────────────────────── */
export const unitLineSchema = z
  .object({
    rooms: asIntOrNull.optional(), // 0 허용, 빈값은 null
    baths: asIntOrNull.optional(),
    hasLoft: z.boolean().optional().default(false),
    hasTerrace: z.boolean().optional().default(false),
    minPrice: asIntOrNull.optional(), // 가격 범위: 빈값은 null
    maxPrice: asIntOrNull.optional(),
  })
  // 선택 제약: 두 값이 모두 있을 때 max >= min
  .refine(
    (v) =>
      v.minPrice == null ||
      v.maxPrice == null ||
      (typeof v.minPrice === "number" &&
        typeof v.maxPrice === "number" &&
        v.maxPrice >= v.minPrice),
    {
      message: "최대 가격은 최소 가격보다 크거나 같아야 합니다.",
      path: ["maxPrice"],
    }
  );

/* ────────────────────────────────────────────────────────────
 * Form Schema
 * ──────────────────────────────────────────────────────────── */
export const propertyFormSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  status: z.enum(["판매중", "계약완료"]),
  type: z.enum(["아파트", "오피스텔", "빌라", "상가", "토지"]).optional(),

  /** ✅ 전화번호: 필수 + 형식 검사 */
  phone: phoneSchemaKR,

  // 숫자 입력은 asIntOrNull로 통일: "" -> null, 그 외 숫자만 통과
  priceSale: asIntOrNull.optional(),
  priceDeposit: asIntOrNull.optional(),
  priceMonthly: asIntOrNull.optional(),

  area: z.string().optional(),
  // RHF가 문자열을 넣어줄 수 있으므로 number 대신 asIntOrNull
  rooms: asIntOrNull.optional(),

  address: z.string().min(1, "주소는 필수입니다."),
  detailAddress: z.string().optional(),

  description: z.string().optional(),
  isPublished: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).default([]),

  /** ✅ 총 주차 대수 (백엔드 키와 일치) */
  totalParkingSlots: asIntOrNull.optional(),

  /** ✅ 옵션: 백엔드에서 필수 배열 → 기본값 [] */
  options: z.array(z.string()).default([]),

  publicMemo: z.string().optional(),
  privateMemo: z.string().optional(), // (secretMemo로 마이그레이션 중이면 폼에는 유지)

  /** ✅ 유닛 라인: UI에서 입력한 라인들을 그대로 들고 있다가 build 단계에서 서버용 units로 변환 */
  unitLines: z.array(unitLineSchema).default([]),

  /** ✅ 엘리베이터: "O" | "X" (UI에서 Segment로 선택) */
  elevator: z.enum(["O", "X"]).optional(),

  /** ✅ 평점 계열: "", "1"~"5" */
  parkingGrade: asStarStr.optional().default(""),
  slopeGrade: asStarStr.optional().default(""),
  structureGrade: asStarStr.optional().default(""),
});

export type PropertyStatus = z.infer<typeof propertyFormSchema>["status"];
export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

/* ────────────────────────────────────────────────────────────
 * RHF defaultValues
 * ──────────────────────────────────────────────────────────── */
export const defaultPropertyFormValues: Partial<PropertyFormValues> = {
  isPublished: true,
  // 필요 시 기본 상태 지정 원하면 주석 해제
  // status: "판매중",
  phone: "", // ✅ 추가
  totalParkingSlots: null,
  options: [],
  unitLines: [],
  imageUrls: [],
  elevator: "O",
  parkingGrade: "",
  slopeGrade: "",
  structureGrade: "",
};

/* ────────────────────────────────────────────────────────────
 * DTO 변환 유틸
 * ──────────────────────────────────────────────────────────── */
export const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/* ────────────────────────────────────────────────────────────
 * Build Create / Update Payload (단일 소스: lib/* 로 위임)
 * ──────────────────────────────────────────────────────────── */
// 👉 이 파일엔 스키마/헬퍼만 남기고, 빌더는 lib/* 의 단일 구현을 사용합니다.
export { buildCreatePayload } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePayload";
export { buildUpdatePayload } from "@/features/properties/components/PropertyEditModal/lib/buildUpdatePayload";
