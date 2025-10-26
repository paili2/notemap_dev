// src/features/properties/schemas/propertyForm.ts
import { z } from "zod";
import type {
  CreatePayload,
  UpdatePayload,
} from "@/features/properties/types/property-dto";

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
  privateMemo: z.string().optional(), // (향후 secretMemo로 마이그레이션 예정시 유지)
});

export type PropertyStatus = z.infer<typeof propertyFormSchema>["status"];
export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

/* ────────────────────────────────────────────────────────────
 * RHF defaultValues
 * ──────────────────────────────────────────────────────────── */
export const defaultPropertyFormValues: Partial<PropertyFormValues> = {
  isPublished: true,
  totalParkingSlots: null,
  options: [], // ← 추가
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
 * Build Create / Update Payload
 * ──────────────────────────────────────────────────────────── */
export function buildCreatePayload(f: PropertyFormValues): CreatePayload {
  const payload: CreatePayload = {
    title: f.title,
    address: f.address,
    totalParkingSlots: toIntOrNull(f.totalParkingSlots),
    options: f.options ?? [], // ✅ 필수 충족
    publicMemo: f.publicMemo,
    privateMemo: f.privateMemo,
    // 필요 시 추가 매핑들...
  };
  return payload;
}

export function buildUpdatePayload(f: PropertyFormValues): UpdatePayload {
  const payload: UpdatePayload = {
    title: f.title,
    address: f.address,
    totalParkingSlots: toIntOrNull(f.totalParkingSlots),
    options: f.options ?? [], // ← 서버가 부분 업데이트에도 배열 기대 시 포함
    publicMemo: f.publicMemo ?? null,
    secretMemo: f.privateMemo ?? null, // (secretMemo로 전환 중이라면 이렇게 매핑)
    // 필요 시 추가 매핑들...
  };
  return payload;
}
