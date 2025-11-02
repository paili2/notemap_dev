import { z } from "zod";

/* ────────────────────────────────────────────────────────────
 * Zod helpers
 * ──────────────────────────────────────────────────────────── */
const toNullIfEmpty = (v: unknown) => (v === "" ? null : v);

/** 숫자 또는 null 로 정규화(빈 문자열 → null, 정수화) */
export const asIntOrNull = z.preprocess((v) => {
  v = toNullIfEmpty(v);
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : v; // 숫자 아니면 그대로 두어 zod가 에러로 잡게
}, z.number().int().nonnegative().nullable());

/* ────────────────────────────────────────────────────────────
 * Unit line schema (UI 전용 → build 단계에서 서버 DTO로 매핑)
 * ──────────────────────────────────────────────────────────── */
export const unitLineSchema = z.object({
  rooms: asIntOrNull.optional(), // 0 허용, 빈값은 null
  baths: asIntOrNull.optional(),
  hasLoft: z.boolean().optional().default(false),
  hasTerrace: z.boolean().optional().default(false),
  minPrice: asIntOrNull.optional(), // 가격 범위: 빈값은 null
  maxPrice: asIntOrNull.optional(),
});

/* ────────────────────────────────────────────────────────────
 * Form Schema
 * ──────────────────────────────────────────────────────────── */
export const propertyFormSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  status: z.enum(["판매중", "계약완료"]),
  type: z.enum(["아파트", "오피스텔", "빌라", "상가", "토지"]).optional(),

  priceSale: z.string().optional(),
  priceDeposit: z.string().optional(),
  priceMonthly: z.string().optional(),

  area: z.string().optional(),
  rooms: z.number().int().min(0).optional(),

  address: z.string().min(1, "주소는 필수입니다."),
  detailAddress: z.string().optional(),

  description: z.string().optional(),
  isPublished: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),

  /** ✅ 총 주차 대수 (백엔드 키와 일치) */
  totalParkingSlots: asIntOrNull.optional(),

  /** ✅ 옵션: 백엔드에서 필수 배열 → 기본값 [] */
  options: z.array(z.string()).default([]),

  publicMemo: z.string().optional(),
  privateMemo: z.string().optional(), // (secretMemo로 마이그레이션 중이면 폼에는 유지)

  /** ✅ 유닛 라인: UI에서 입력한 라인들을 그대로 들고 있다가 build 단계에서 서버용 units로 변환 */
  unitLines: z.array(unitLineSchema).default([]),
});

export type PropertyStatus = z.infer<typeof propertyFormSchema>["status"];
export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

/* ────────────────────────────────────────────────────────────
 * RHF defaultValues
 * ──────────────────────────────────────────────────────────── */
export const defaultPropertyFormValues: Partial<PropertyFormValues> = {
  isPublished: true,
  totalParkingSlots: null,
  options: [],
  unitLines: [], // ✅ 기본값 추가
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
