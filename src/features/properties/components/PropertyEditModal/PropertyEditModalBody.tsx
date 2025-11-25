"use client";

import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import FooterButtons from "../sections/FooterButtons/FooterButtons";
import type { PropertyEditModalProps } from "./types";
import { useEditImages } from "./hooks/useEditImages";
import { useEditForm } from "./hooks/useEditForm/useEditForm";

import HeaderContainer from "./ui/HeaderContainer";
import BasicInfoContainer from "./ui/BasicInfoContainer";
import NumbersContainer from "./ui/NumbersContainer";

import AspectsContainer from "./ui/AspectsContainer";
import AreaSetsContainer from "./ui/AreaSetsContainer";
import StructureLinesContainer from "./ui/StructureLinesContainer";
import OptionsContainer from "./ui/OptionsContainer";
import MemosContainer from "./ui/MemosContainer";
import ImagesContainer from "./ui/ImagesContainer";
import { buildUpdatePayload } from "./lib/buildUpdatePayload";
import { updatePin, UpdatePinDto } from "@/shared/api/pins";
import { useQueryClient } from "@tanstack/react-query";
import {
  mapBadgeToPinKind,
  mapPinKindToBadge,
} from "@/features/properties/lib/badge";
import ParkingContainer from "./ui/ParkingContainer";
import CompletionRegistryContainer from "./ui/CompletionRegistryContainer";
import type { CompletionRegistryFormSlice } from "../../hooks/useEditForm/types";

/* 면적 그룹 유틸 & 타입 */
import { buildAreaGroups } from "@/features/properties/lib/area";
import type { AreaSet as StrictAreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";
import { BuildingType, Grade } from "../../types/property-domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog/Dialog";

/** Parking 슬라이스 타입 */
type ParkingFormSlice = {
  parkingTypeId: number | null;
  setParkingTypeId: (v: number | null) => void;

  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;
};

/** ⭐ 매물평점 문자열 타입 (HeaderContainer의 parkingGrade에서 사용) */
type StarStr = "" | "1" | "2" | "3" | "4" | "5";

/** 어떤 입력이 와도 '' | '1'~'5' 로 정규화 */
function normalizeStarStr(v: unknown): StarStr {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return (["", "1", "2", "3", "4", "5"].includes(s) ? s : "") as StarStr;
}

/** UI에서 허용하는 등기/건물타입 (라디오 버튼 라벨 기준) */
const BUILDING_TYPES: BuildingType[] = ["주택", "APT", "OP", "도생", "근생"];

/** 서버/폼 값 → 우리가 쓰는 라벨 그대로만 허용 (추가 매핑 없음) */
const normalizeBuildingType = (v: any): BuildingType | undefined => {
  if (v == null) return undefined;
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return undefined;
  return BUILDING_TYPES.includes(s as BuildingType)
    ? (s as BuildingType)
    : undefined;
};

/* ───────── helpers ───────── */

// ── 전화번호(KR) 유틸 ──
const normalizePhone = (v: string) => v.replace(/[^\d]/g, "");
const isValidPhoneKR = (raw?: string | null) => {
  const s = (raw ?? "").trim();
  if (!s) return false;
  const v = normalizePhone(s);
  if (!/^0\d{9,10}$/.test(v)) return false;
  if (v.startsWith("02")) return v.length === 9 || v.length === 10;
  return v.length === 10 || v.length === 11;
};

/* === 날짜 유틸 (추가) === */
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** 8자리 숫자(YYYYMMDD)는 YYYY-MM-DD로 포맷, 그 외는 트림만 */
const normalizeDateInput = (raw?: string | null): string => {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^\d{8}$/.test(s)) {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6));
    const d = Number(s.slice(6, 8));
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }
  return s;
};

/** 정확히 YYYY-MM-DD 형식 + 실제 존재하는 날짜만 true */
const isValidIsoDateStrict = (s?: string | null): boolean => {
  const v = String(s ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
};

// === 유닛 라인(구조별 입력) 최소/최대 매매가 검증 ===
const priceOrNull = (v: any): number | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** 배열을 훑어보고, 위반 있으면 에러 메시지 반환(없으면 null) */
const validateUnitPriceRanges = (units?: any[]): string | null => {
  if (!Array.isArray(units)) return null;

  for (let i = 0; i < units.length; i++) {
    const u = units[i] ?? {};
    const label = (u?.label ?? u?.name ?? `${i + 1}번째 구조`)
      .toString()
      .trim();
    const min = priceOrNull(u?.minPrice ?? u?.primary);
    const max = priceOrNull(u?.maxPrice ?? u?.secondary);

    if (min === 0 || max === 0) {
      return `${label}: 0원은 입력할 수 없습니다.`;
    }
    if (min != null && max != null) {
      if (max === min) return `${label}: 최소·최대 매매가가 같을 수 없습니다.`;
      if (max < min)
        return `${label}: 최대매매가는 최소매매가보다 커야 합니다.`;
    }
  }
  return null;
};

// === 개별평수 입력(전용/실평) 최소/최대 검증 ===
const numOrNull = (v: any): number | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

type RangeCheckResult = { ok: true } | { ok: false; msg: string };

const checkRange = (
  minRaw: any,
  maxRaw: any,
  label: string
): RangeCheckResult => {
  const min = numOrNull(minRaw);
  const max = numOrNull(maxRaw);

  if (min === 0 || max === 0) {
    return { ok: false, msg: `${label}: 0은 입력할 수 없습니다.` };
  }
  if (min == null || max == null) return { ok: true };

  if (max === min) {
    return { ok: false, msg: `${label}: 최소와 최대가 같을 수 없습니다.` };
  }
  if (max < min) {
    return { ok: false, msg: `${label}: 최대는 최소보다 커야 합니다.` };
  }
  return { ok: true };
};

/** baseAreaSet + extraAreaSets 전체 검사. 문제가 없으면 null */
const validateAreaRanges = (base?: any, extras?: any[]): string | null => {
  const checks = (g: any, prefix = ""): string | null => {
    {
      const r = checkRange(
        g?.exMinM2 ?? g?.exclusiveMin,
        g?.exMaxM2 ?? g?.exclusiveMax,
        `${prefix}전용 m²`
      );
      if (!r.ok) return r.msg;
    }
    {
      const r = checkRange(
        g?.exMinPy ?? g?.exclusiveMinPy,
        g?.exMaxPy ?? g?.exclusiveMaxPy,
        `${prefix}전용 평`
      );
      if (!r.ok) return r.msg;
    }
    {
      const r = checkRange(
        g?.realMinM2 ?? g?.realMin,
        g?.realMaxM2 ?? g?.realMax,
        `${prefix}실평 m²`
      );
      if (!r.ok) return r.msg;
    }
    {
      const r = checkRange(g?.realMinPy, g?.realMaxPy, `${prefix}실평 평`);
      if (!r.ok) return r.msg;
    }
    return null;
  };

  if (base) {
    const msg = checks(base);
    if (msg) return msg;
  }
  if (Array.isArray(extras)) {
    for (let i = 0; i < extras.length; i++) {
      const title = String(extras[i]?.title ?? "").trim();
      const prefix = title ? `면적세트 "${title}" - ` : `면적세트 ${i + 1} - `;
      const msg = checks(extras[i], prefix);
      if (msg) return msg;
    }
  }
  return null;
};

const N = (v: any): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const S = (v: any): string | undefined => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : undefined;
};
const toBool = (v: any): boolean | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number")
    return v === 1 ? true : v === 0 ? false : undefined;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "y", "yes", "o"].includes(s)) return true;
  if (["0", "false", "n", "no", "x"].includes(s)) return false;
  return undefined;
};

/* AreaSet 정규화 */
const toStrictAreaSet = (s: any): StrictAreaSet => ({
  title: String(s?.title ?? ""),
  exMinM2: String(s?.exMinM2 ?? ""),
  exMaxM2: String(s?.exMaxM2 ?? ""),
  exMinPy: String(s?.exMinPy ?? ""),
  exMaxPy: String(s?.exMaxPy ?? ""),
  realMinM2: String(s?.realMinM2 ?? ""),
  realMaxM2: String(s?.realMaxM2 ?? ""),
  realMinPy: String(s?.realMinPy ?? ""),
  realMaxPy: String(s?.realMaxPy ?? ""),
});

/* ✅ 옵션 빌드/정규화 */
const buildOptionsFromForm = (f: any) => {
  const selected: string[] = Array.isArray(f.options) ? f.options : [];
  const has = (label: string) => selected.includes(label);
  const extraRaw = String(f.optionEtc ?? "").trim();

  const out: any = {
    hasAircon: has("에어컨"),
    hasFridge: has("냉장고"),
    hasWasher: has("세탁기"),
    hasDryer: has("건조기"),
    hasBidet: has("비데"),
    hasAirPurifier: has("공기순환기"),
  };
  if (extraRaw) out.extraOptionsText = extraRaw.slice(0, 255);

  const any =
    out.hasAircon ||
    out.hasFridge ||
    out.hasWasher ||
    out.hasDryer ||
    out.hasBidet ||
    out.hasAirPurifier ||
    !!out.extraOptionsText;

  return any ? out : null;
};

/* ⚠️ 비교용 옵션 정규화(빈 값 제거) */
const normalizeOptionsForCompare = (o: any) => {
  if (!o) return null;
  const t = (s: any) => {
    const v = String(s ?? "").trim();
    return v ? v.slice(0, 255) : undefined;
  };
  const x = {
    hasAircon: !!o.hasAircon || undefined,
    hasFridge: !!o.hasFridge || undefined,
    hasWasher: !!o.hasWasher || undefined,
    hasDryer: !!o.hasDryer || undefined,
    hasBidet: !!o.hasBidet || undefined,
    hasAirPurifier: !!o.hasAirPurifier || undefined,
    extraOptionsText: t(o.extraOptionsText),
  };
  const y: any = {};
  for (const [k, v] of Object.entries(x)) if (v !== undefined) y[k] = v;
  return Object.keys(y).length ? y : null;
};

/* ───────── deep prune & 비교 유틸 ───────── */
const normalizeShallow2 = (v: any) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (Array.isArray(v) && v.length === 0) return undefined;
  return v;
};
const jsonEq2 = (a: any, b: any) => {
  const na = normalizeShallow2(a);
  const nb = normalizeShallow2(b);
  if (na === nb) return true;
  if (!na || !nb || typeof na !== "object" || typeof nb !== "object")
    return false;
  try {
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch {
    return false;
  }
};
function deepPrune<T>(obj: T): Partial<T> {
  const prune = (v: any): any => {
    if (v === undefined) return undefined;
    if (Array.isArray(v)) {
      const arr = v.map(prune).filter((x: unknown) => x !== undefined);
      return arr.length ? arr : undefined;
    }
    if (v && typeof v === "object") {
      const out: Record<string, any> = {};
      for (const [k, vv] of Object.entries(v)) {
        const pv = prune(vv);
        if (pv !== undefined) out[k] = pv;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return v;
  };
  const pruned = prune(obj);
  return (pruned ?? {}) as Partial<T>;
}
function hasMeaningfulPatch(obj: object | null | undefined): boolean {
  if (!obj) return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  for (const k of keys) {
    const v = (obj as any)[k];
    if (v !== undefined) return true;
  }
  return false;
}

/* ───────── 향/방향 & 유닛 비교 유틸 ───────── */
const normStrU = (v: any): string | undefined => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" || s === "-" || s === "—" ? undefined : s;
};
const normAspectNo = (v: any): string | undefined => {
  const s = normStrU(v);
  if (!s) return undefined;
  const num = s.replace(/[^\d]/g, "");
  return num === "" ? undefined : num;
};
type OrientationLike = any;
const normOrientations = (arr: any): any[] | undefined => {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const pickKey = (o: OrientationLike) =>
    String(
      o?.code ??
        o?.key ??
        o?.name ??
        o?.dir ??
        o?.direction ??
        JSON.stringify(o ?? {})
    ).trim();
  const normed = arr
    .map((o) => ({ key: pickKey(o) }))
    .filter((o) => o.key !== "");
  if (normed.length === 0) return undefined;
  normed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return normed;
};
const aspectBundlesEqual = (A: any, B: any): boolean => {
  const toCmp = (x: any) => ({
    aspect: normStrU(x?.aspect),
    aspect1: normStrU(x?.aspect1),
    aspect2: normStrU(x?.aspect2),
    aspect3: normStrU(x?.aspect3),
    aspectNoKey: normAspectNo(x?.aspectNo),
    orientations: normOrientations(x?.orientations) ?? undefined,
  });
  try {
    return JSON.stringify(toCmp(A)) === JSON.stringify(toCmp(B));
  } catch {
    return false;
  }
};

type UnitLike2 = {
  rooms?: number | string | null;
  baths?: number | string | null;
  duplex?: boolean;
  terrace?: boolean;
  primary?: number | string | null;
  secondary?: number | string | null;
  hasLoft?: boolean;
  hasTerrace?: boolean;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  note?: string | null;
};
const bPick = (u: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = u?.[k];
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
  }
  return false;
};
const nPick = <T,>(u: any, ...keys: string[]) => {
  for (const k of keys) if (u?.[k] !== undefined) return u[k] as T;
  return undefined as unknown as T;
};
const toNumOrNull = (v: any): number | null => {
  const n = N(v);
  return n === undefined ? null : n;
};
const normUnit = (u?: UnitLike2) => {
  const x: any = u ?? {};
  return {
    rooms: toNumOrNull(nPick(x, "rooms")),
    baths: toNumOrNull(nPick(x, "baths")),
    hasLoft: bPick(x, "hasLoft", "duplex"),
    hasTerrace: bPick(x, "hasTerrace", "terrace"),
    minPrice: toNumOrNull(nPick(x, "minPrice", "primary")),
    maxPrice: toNumOrNull(nPick(x, "maxPrice", "secondary")),
    note: nPick<string | null>(x, "note") ?? null,
  };
};
const sameUnit2 = (a?: UnitLike2, b?: UnitLike2) => {
  const A = normUnit(a);
  const B = normUnit(b);
  return (
    A.rooms === B.rooms &&
    A.baths === B.baths &&
    A.hasLoft === B.hasLoft &&
    A.hasTerrace === B.hasTerrace &&
    A.minPrice === B.minPrice &&
    A.maxPrice === B.maxPrice &&
    A.note === B.note
  );
};
const unitsChanged = (prev?: any[], curr?: any[]) => {
  const P = Array.isArray(prev) ? prev : undefined;
  const C = Array.isArray(curr) ? curr : undefined;
  if (!P && !C) return false;
  if (!P || !C) return true;
  if (P.length !== C.length) return true;
  for (let i = 0; i < P.length; i++) if (!sameUnit2(P[i], C[i])) return true;
  return false;
};

type InitialSnapshot = { [key: string]: any };

/* ───────── 폼 → 서버 최소 PATCH ───────── */
function toPinPatch(
  f: ReturnType<typeof useEditForm>,
  initial: InitialSnapshot
): UpdatePinDto {
  console.groupCollapsed("[toPinPatch] start");
  console.log("[toPinPatch] initial:", initial);
  console.log("[toPinPatch] form.baseAreaSet:", f.baseAreaSet);
  console.log("[toPinPatch] form.extraAreaSets:", f.extraAreaSets);

  const patch: Partial<UpdatePinDto> = {};
  const S2 = (v: any) => {
    const t = typeof v === "string" ? v.trim() : "";
    return t ? t : undefined;
  };
  const N2 = (v: any): number | undefined => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };
  const jsonEq2Local = (a: any, b: any) => {
    const norm = (x: any) =>
      x === "" || x === null || x === undefined ? undefined : x;
    try {
      return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
    } catch {
      return false;
    }
  };

  // name
  const initName = (initial as any)?.name ?? (initial as any)?.title ?? "";
  const nowName = S2((f as any).title);
  if (nowName !== undefined && !jsonEq2Local(initName, nowName))
    (patch as any).name = nowName;

  // 연락처
  const initMainLabel =
    (initial as any)?.contactMainLabel ?? (initial as any)?.officeName ?? "";
  const initMainPhone =
    (initial as any)?.contactMainPhone ?? (initial as any)?.officePhone ?? "";
  const initSubPhone =
    (initial as any)?.contactSubPhone ?? (initial as any)?.officePhone2 ?? "";
  const nowMainLabel = S2((f as any).officeName);
  const nowMainPhone = S2((f as any).officePhone);
  const nowSubPhone = S2((f as any).officePhone2);
  if (nowMainLabel !== undefined && !jsonEq2Local(initMainLabel, nowMainLabel))
    (patch as any).contactMainLabel = nowMainLabel;
  if (nowMainPhone !== undefined && !jsonEq2Local(initMainPhone, nowMainPhone))
    (patch as any).contactMainPhone = nowMainPhone;
  if (nowSubPhone !== undefined && !jsonEq2Local(initSubPhone, nowSubPhone))
    (patch as any).contactSubPhone = nowSubPhone;

  // 완공일
  if (
    !jsonEq2Local((initial as any)?.completionDate, (f as any).completionDate)
  ) {
    (patch as any).completionDate = S2((f as any).completionDate) ?? null;
  }

  // 엘리베이터
  const initElev = toBool(
    (initial as any)?.hasElevator ?? (initial as any)?.elevator
  );
  const nowElev = toBool((f as any)?.elevator);
  if (nowElev !== undefined && nowElev !== initElev)
    (patch as any).hasElevator = nowElev;

  // 메모
  if (!jsonEq2Local((initial as any)?.publicMemo, (f as any).publicMemo))
    (patch as any).publicMemo = (f as any).publicMemo ?? null;
  const initPrivate =
    (initial as any)?.privateMemo ?? (initial as any)?.secretMemo;
  if (!jsonEq2Local(initPrivate, (f as any).secretMemo))
    (patch as any).privateMemo = (f as any).secretMemo ?? null;

  /* ✅ 옵션 diff */
  {
    const nowOpts = buildOptionsFromForm(f);
    const initOptsObj = (initial as any)?.options ?? null;

    const initFromSlices = buildOptionsFromForm({
      options:
        (initial as any)?.options ??
        (initial as any)?.options?.options ??
        (initial as any)?.optionsLabels ??
        (initial as any)?.optionList ??
        [],
      optionEtc:
        (initial as any)?.optionEtc ?? (initial as any)?.extraOptionsText ?? "",
    });

    const sameByServerObj =
      JSON.stringify(normalizeOptionsForCompare(initOptsObj)) ===
      JSON.stringify(normalizeOptionsForCompare(nowOpts));

    const sameBySlices =
      JSON.stringify(normalizeOptionsForCompare(initFromSlices)) ===
      JSON.stringify(normalizeOptionsForCompare(nowOpts));

    if (!(sameByServerObj || sameBySlices)) {
      (patch as any).options = nowOpts; // 객체(upsert) 또는 null(삭제)
    }
  }

  // 최저 실입
  const initMinCost =
    (initial as any)?.minRealMoveInCost ??
    (Number.isFinite(Number((initial as any)?.salePrice))
      ? Number((initial as any)?.salePrice)
      : undefined);
  const nowMinCostNum = N2((f as any).salePrice);
  if (!jsonEq2Local(initMinCost, nowMinCostNum))
    (patch as any).minRealMoveInCost = nowMinCostNum ?? null;

  // --- 등기/건물타입 diff (변경시에만; 추가 매핑 없이 그대로 비교) ---
  const pickRegistryString = (src: any): string | undefined => {
    if (!src) return undefined;
    const candidates = [
      src?.buildingType,
      src?.registry,
      src?.type,
      src?.propertyType,
      src?.registryOne,
    ];
    const fromAny = (v: any): string | undefined => {
      if (!v) return undefined;
      if (typeof v === "string" && v.trim() !== "") return v.trim();
      if (typeof v === "object") {
        const s =
          v.value ?? v.code ?? v.label ?? v.name ?? v.id ?? v.key ?? v.text;
        if (typeof s === "string" && s.trim() !== "") return s.trim();
      }
      return undefined;
    };
    for (const c of candidates) {
      const val = fromAny(c);
      if (val) return val;
    }
    return undefined;
  };

  const btInitRaw = pickRegistryString(initial);
  const btInit = normalizeBuildingType(btInitRaw);

  const btNowUI = (f as any)?.buildingType as BuildingType | null | undefined;
  const btNow = normalizeBuildingType(btNowUI);

  console.log("[registry(buildingType)]", {
    btInitRaw,
    btInit,
    btNowUI,
    btNow,
  });

  // ✅ 사용자가 "도생" 같은 값을 선택하면 그대로 buildingType/registry에 실리도록
  if (btNow !== undefined && btNow !== btInit) {
    (patch as any).buildingType = btNow;
    (patch as any).registry = btNow;
  }

  // ── 핀종류(pinKind) 변경 감지 ──
  {
    const initPinKind =
      (initial as any)?.pinKind ??
      ((initial as any)?.badge
        ? mapBadgeToPinKind((initial as any).badge)
        : undefined);
    const nowPinKind = (f as any)?.pinKind;
    console.log("[pinKind diff]", { initPinKind, nowPinKind });
    if (nowPinKind !== undefined && nowPinKind !== initPinKind) {
      (patch as any).pinKind = nowPinKind;
      try {
        const badge = mapPinKindToBadge?.(nowPinKind);
        if (badge) (patch as any).badge = badge;
      } catch {}
    }
  }

  // 경사/구조 grade
  if (!jsonEq2Local((initial as any)?.slopeGrade, (f as any).slopeGrade))
    (patch as any).slopeGrade = (f as any).slopeGrade ?? null;
  if (
    !jsonEq2Local((initial as any)?.structureGrade, (f as any).structureGrade)
  )
    (patch as any).structureGrade = (f as any).structureGrade ?? null;

  /* ── 주차 관련 필드: parkingGrade / parkingType / parkingTypeId / totalParkingSlots ── */

  // 1) 별점(문자열 "1"~"5" 또는 null)
  const pgInitRaw = (initial as any)?.parkingGrade;
  const pgInitNorm =
    pgInitRaw == null || String(pgInitRaw).trim() === ""
      ? null
      : String(pgInitRaw).trim();

  const pgNowRaw = (f as any).parkingGrade;
  const pgNowNorm =
    pgNowRaw == null || String(pgNowRaw).trim() === ""
      ? null
      : String(pgNowRaw).trim();

  if (!jsonEq2Local(pgInitNorm, pgNowNorm)) {
    (patch as any).parkingGrade = pgNowNorm;
  }

  // 2) parkingTypeId: number | null (diff 기반, 숫자로 변환)
  const initParkingTypeIdRaw = (initial as any)?.parkingTypeId;
  const initParkingTypeId =
    initParkingTypeIdRaw == null || initParkingTypeIdRaw === ""
      ? null
      : Number(initParkingTypeIdRaw);

  const nowParkingTypeIdForm = (f as any).parkingTypeId;
  const nowParkingTypeId =
    nowParkingTypeIdForm == null || nowParkingTypeIdForm === ""
      ? null
      : Number(nowParkingTypeIdForm);

  if (!jsonEq2Local(initParkingTypeId, nowParkingTypeId)) {
    (patch as any).parkingTypeId = nowParkingTypeId;
  }

  // 3) parkingType: ✅ 무조건 dto에 실어 보낸다 (diff 실패 방지)
  {
    const raw = (f as any).parkingType;
    const value =
      raw == null ||
      String(raw).trim() === "" ||
      String(raw).trim() === "custom"
        ? null
        : String(raw).trim();

    console.log("[toPinPatch][parkingType]", {
      initParkingType: (initial as any)?.parkingType,
      nowRaw: raw,
      send: value,
    });

    (patch as any).parkingType = value;
  }

  // 4) totalParkingSlots: number | null (diff 기반)
  const slotsInitRaw = (initial as any)?.totalParkingSlots;
  const slotsInit =
    slotsInitRaw == null || String(slotsInitRaw).trim() === ""
      ? null
      : Number(String(slotsInitRaw).replace(/[^\d]/g, ""));

  const slotsNowRaw = (f as any).totalParkingSlots;
  const slotsNow =
    slotsNowRaw == null || String(slotsNowRaw).trim() === ""
      ? null
      : Number(String(slotsNowRaw).replace(/[^\d]/g, ""));

  if (!jsonEq2Local(slotsInit, slotsNow)) {
    (patch as any).totalParkingSlots = slotsNow;
  }

  // 숫자들
  const initTotalBuildings = N2((initial as any)?.totalBuildings);
  const initTotalFloors = N2((initial as any)?.totalFloors);
  const initTotalHouseholds = N2((initial as any)?.totalHouseholds);
  const initRemainingHouseholds = N2((initial as any)?.remainingHouseholds);

  const nowTotalBuildings = N2((f as any).totalBuildings);
  const nowTotalFloors = N2((f as any).totalFloors);
  const nowTotalHouseholds = N2((f as any).totalHouseholds);
  const nowRemainingHouseholds = N2((f as any).remainingHouseholds);

  if (!jsonEq2Local(initTotalBuildings, nowTotalBuildings))
    (patch as any).totalBuildings = nowTotalBuildings ?? null;
  if (!jsonEq2Local(initTotalFloors, nowTotalFloors))
    (patch as any).totalFloors = nowTotalFloors ?? null;
  if (!jsonEq2Local(initTotalHouseholds, nowTotalHouseholds))
    (patch as any).totalHouseholds = nowTotalHouseholds ?? null;
  if (!jsonEq2Local(initRemainingHouseholds, nowRemainingHouseholds))
    (patch as any).remainingHouseholds = nowRemainingHouseholds ?? null;

  // === 면적: 단일값 + 범위 ===
  {
    const {
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,
    } = (f as any).packAreas?.() ?? {};

    const Snum = (v: any) =>
      v === null || v === undefined || v === "" ? undefined : String(v).trim();

    if (!jsonEq2Local((initial as any)?.exclusiveArea, exclusiveArea))
      (patch as any).exclusiveArea = Snum(exclusiveArea) ?? null;

    if (!jsonEq2Local((initial as any)?.realArea, realArea))
      (patch as any).realArea = Snum(realArea) ?? null;

    if (
      !jsonEq2Local((initial as any)?.extraExclusiveAreas, extraExclusiveAreas)
    )
      (patch as any).extraExclusiveAreas = Array.isArray(extraExclusiveAreas)
        ? extraExclusiveAreas
        : [];

    if (!jsonEq2Local((initial as any)?.extraRealAreas, extraRealAreas))
      (patch as any).extraRealAreas = Array.isArray(extraRealAreas)
        ? extraRealAreas
        : [];

    if (!jsonEq2Local((initial as any)?.baseAreaTitleOut, baseAreaTitleOut))
      (patch as any).baseAreaTitleOut = Snum(baseAreaTitleOut) ?? null;

    if (!jsonEq2Local((initial as any)?.extraAreaTitlesOut, extraAreaTitlesOut))
      (patch as any).extraAreaTitlesOut = Array.isArray(extraAreaTitlesOut)
        ? extraAreaTitlesOut
        : [];
  }

  // 2) 범위(m²/평)
  {
    const normNum = (v: any): string | undefined => {
      if (v === "" || v == null) return undefined;
      const n = Number(String(v).replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) ? String(n) : undefined;
    };

    const initSnap = {
      exMin: normNum((initial as any)?.exclusiveAreaMin),
      exMax: normNum((initial as any)?.exclusiveAreaMax),
      exMinPy: normNum((initial as any)?.exclusiveAreaMinPy),
      exMaxPy: normNum((initial as any)?.exclusiveAreaMaxPy),
      realMin: normNum((initial as any)?.realAreaMin),
      realMax: normNum((initial as any)?.realAreaMax),
      realMinPy: normNum((initial as any)?.realAreaMinPy),
      realMaxPy: normNum((initial as any)?.realAreaMaxPy),
    };

    const s = (f as any).baseAreaSet ?? {};
    const nowSnap = {
      exMin: normNum(
        s?.exclusiveMin ?? s?.exMinM2 ?? s?.exclusive?.minM2 ?? s?.m2Min
      ),
      exMax: normNum(
        s?.exclusiveMax ?? s?.exMaxM2 ?? s?.exclusive?.maxM2 ?? s?.m2Max
      ),
      exMinPy: normNum(
        s?.exclusiveMinPy ?? s?.exMinPy ?? s?.exclusive?.minPy ?? s?.pyMin
      ),
      exMaxPy: normNum(
        s?.exclusiveMaxPy ?? s?.exMaxPy ?? s?.exclusive?.maxPy ?? s?.pyMax
      ),
      realMin: normNum(s?.realMin ?? s?.realMinM2 ?? s?.real?.minM2),
      realMax: normNum(s?.realMax ?? s?.realMaxM2 ?? s?.real?.maxM2),
      realMinPy: normNum(s?.realMinPy ?? s?.real?.minPy),
      realMaxPy: normNum(s?.realMaxPy ?? s?.real?.maxPy),
    };

    const putIfChanged = (key: keyof typeof initSnap, patchKey: string) => {
      const prev = (initSnap as any)[key];
      const curr = (nowSnap as any)[key];
      if (curr !== undefined && curr !== prev) (patch as any)[patchKey] = curr;
    };

    putIfChanged("exMin", "exclusiveAreaMin");
    putIfChanged("exMax", "exclusiveAreaMax");
    putIfChanged("exMinPy", "exclusiveAreaMinPy");
    putIfChanged("exMaxPy", "exclusiveAreaMaxPy");
    putIfChanged("realMin", "realAreaMin");
    putIfChanged("realMax", "realAreaMax");
    putIfChanged("realMinPy", "realAreaMinPy");
    putIfChanged("realMaxPy", "realAreaMaxPy");
  }

  type AreaGroupNorm = {
    title: string;
    exclusiveMinM2?: string;
    exclusiveMaxM2?: string;
    realMinM2?: string;
    realMaxM2?: string;
  };

  /* 3) 면적 그룹 — 초기 vs 현재 그룹 ‘정규화’ 비교 */
  {
    console.groupCollapsed("[areaGroups] 비교 시작");

    const canonNumStr = (v: any): string | undefined => {
      if (v === "" || v == null) return undefined;
      const n = Number(String(v).replace(/[^\d.-]/g, ""));
      if (!Number.isFinite(n)) return undefined;
      const r = Math.round(n * 1000) / 1000;
      return String(+r.toFixed(3));
    };

    const normGroup = (g: any): AreaGroupNorm => ({
      title: String(g?.title ?? "").trim(),
      exclusiveMinM2: canonNumStr(
        g?.exclusiveMinM2 ?? g?.exMinM2 ?? g?.exclusiveMin
      ),
      exclusiveMaxM2: canonNumStr(
        g?.exclusiveMaxM2 ?? g?.exMaxM2 ?? g?.exclusiveMax
      ),
      realMinM2: canonNumStr(g?.realMinM2 ?? g?.actualMinM2 ?? g?.realMin),
      realMaxM2: canonNumStr(g?.realMaxM2 ?? g?.actualMaxM2 ?? g?.realMax),
    });

    const pickMeaningful = (arr: unknown): AreaGroupNorm[] =>
      Array.isArray(arr)
        ? (arr as any[])
            .map((g: any) => normGroup(g))
            .filter(
              (x: AreaGroupNorm) =>
                x.title ||
                x.exclusiveMinM2 ||
                x.exclusiveMaxM2 ||
                x.realMinM2 ||
                x.realMaxM2
            )
        : [];

    const keyOf = (g: AreaGroupNorm) =>
      `${g.title}|${g.exclusiveMinM2 ?? ""}|${g.exclusiveMaxM2 ?? ""}|${
        g.realMinM2 ?? ""
      }|${g.realMaxM2 ?? ""}`;

    const sortForCmp = (arr: AreaGroupNorm[]) =>
      [...arr].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));

    const initGroupsRaw: any[] = Array.isArray((initial as any)?.areaGroups)
      ? (initial as any).areaGroups
      : [];

    const strictOf = (s: any) => toStrictAreaSet(s ?? {});
    const strictBase = strictOf((f as any).baseAreaSet ?? {});
    const strictExtras = (
      Array.isArray((f as any).extraAreaSets) ? (f as any).extraAreaSets : []
    ).map(toStrictAreaSet);

    let nowGroupsRaw: any[] = [];
    try {
      console.log("[areaGroups] buildAreaGroups 입력:", {
        strictBase,
        strictExtras,
      });
      nowGroupsRaw = buildAreaGroups(strictBase, strictExtras) ?? [];
    } catch (e) {
      console.warn("[areaGroups] buildAreaGroups 실패:", e);
      nowGroupsRaw = [];
    }

    const normalizeArr = (arr: any[]) =>
      arr
        .map(toStrictAreaSet)
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    const initialBaseStrict = strictOf((initial as any)?.baseAreaSet);
    const initialExtraStrict = normalizeArr(
      (initial as any)?.extraAreaSets ?? []
    );
    const nowBaseStrict = strictOf((f as any).baseAreaSet);
    const nowExtraStrict = normalizeArr((f as any).extraAreaSets ?? []);

    const baseChanged =
      JSON.stringify(initialBaseStrict) !== JSON.stringify(nowBaseStrict);
    const extrasChanged =
      JSON.stringify(initialExtraStrict) !== JSON.stringify(nowExtraStrict);
    const userEditedAreaSets = baseChanged || extrasChanged;

    const initNorm = sortForCmp(pickMeaningful(initGroupsRaw));
    const nowNorm = sortForCmp(pickMeaningful(nowGroupsRaw));
    const hasAreaGroupsDelta =
      JSON.stringify(initNorm) !== JSON.stringify(nowNorm);

    console.log("[areaGroups] 폼스냅샷 비교", {
      initialBaseStrict,
      nowBaseStrict,
      baseChanged,
      initialExtraStrict,
      nowExtraStrict,
      extrasChanged,
      userEditedAreaSets,
    });

    console.log("[areaGroups] 결과 비교", {
      initRaw: initGroupsRaw,
      nowRaw: nowGroupsRaw,
      initNorm,
      nowNorm,
      hasAreaGroupsDelta,
    });

    console.log("[toPinPatch] patch.areaGroups 존재?", {
      hasKey: Object.prototype.hasOwnProperty.call(patch, "areaGroups"),
      value: (patch as any).areaGroups,
    });

    if (userEditedAreaSets && hasAreaGroupsDelta) {
      (patch as any).areaGroups = nowGroupsRaw.length ? nowGroupsRaw : [];
      console.log(
        "[areaGroups] ✅ areaGroups 넣음 (userEditedAreaSets && hasAreaGroupsDelta)"
      );
    } else {
      console.log(
        "[areaGroups] ❌ areaGroups 넣지 않음",
        "(userEditedAreaSets:",
        userEditedAreaSets,
        ", hasAreaGroupsDelta:",
        hasAreaGroupsDelta,
        ")"
      );
    }

    console.groupEnd();
  }

  // ── 향/방향: 변경시에만 directions 전송 ─────────────────────
  {
    const initialHasAnyAspect =
      !!normStrU((initial as any)?.aspect) ||
      !!normStrU((initial as any)?.aspectNo) ||
      !!normStrU((initial as any)?.aspect1) ||
      !!normStrU((initial as any)?.aspect2) ||
      !!normStrU((initial as any)?.aspect3) ||
      (Array.isArray((initial as any)?.orientations) &&
        (initial as any).orientations.length > 0) ||
      (Array.isArray((initial as any)?.directions) &&
        (initial as any).directions.length > 0);

    const pickDirStringsFromInitial = (init: any): string[] => {
      const fromArr = (Array.isArray(init?.directions) ? init.directions : [])
        .map(
          (d: any) =>
            [d?.direction, d?.dir, d?.value, d?.name, d?.code]
              .map((x) => (typeof x === "string" ? x.trim() : ""))
              .find((x) => !!x) || ""
        )
        .filter(Boolean);
      if (fromArr.length) return fromArr;
      return [init?.aspect1, init?.aspect2, init?.aspect3]
        .map((v: any) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
    };

    const hoNum = (v: any) => {
      const s = String(v ?? "").replace(/[^\d]/g, "");
      const n = Number(s);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    };

    const pickHoDirPairsFromForm = () => {
      const bo = (f as any).buildOrientation?.() ?? {};
      const oNow = Array.isArray(bo.orientations) ? bo.orientations : [];
      let pairs = oNow
        .map((o: any) => {
          const dir =
            [o?.dir, o?.value, o?.direction, o?.name, o?.code]
              .map((x) => (typeof x === "string" ? x.trim() : ""))
              .find((x) => !!x) || "";
          const ho = hoNum(o?.ho);
          return dir ? { ho, dir } : null;
        })
        .filter(Boolean) as Array<{ ho: number; dir: string }>;
      if (!pairs.length) {
        const arr = [bo.aspect1, bo.aspect2, bo.aspect3]
          .map((v: any) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean);
        pairs = arr.map((dir: string, idx: number) => ({ ho: idx + 1, dir }));
      }
      pairs.sort((a, b) => a.ho - b.ho);
      return pairs;
    };

    const normSet = (arr: string[]) =>
      Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      );

    const initDirs = normSet(pickDirStringsFromInitial(initial));
    const nowPairs = pickHoDirPairsFromForm();
    const nowDirsSet = normSet(nowPairs.map((p) => p.dir));

    // ✅ 사용자가 향을 편집했을 때만 directions 고려
    if ((f as any).aspectsTouched) {
      if (initialHasAnyAspect) {
        if (JSON.stringify(initDirs) !== JSON.stringify(nowDirsSet)) {
          (patch as any).directions = nowPairs.map((p) => ({
            direction: p.dir,
          }));
        }
      } else {
        (patch as any).directions = nowPairs.map((p) => ({
          direction: p.dir,
        }));
      }
    }
  }

  // 구조(units)
  const initialUnits = ((initial as any)?.unitLines ??
    (initial as any)?.units) as any[] | undefined;
  const currentUnits = ((f as any).unitLines ?? []) as any[];
  if (unitsChanged(initialUnits, currentUnits)) {
    const units = (currentUnits ?? [])
      .map((u) => {
        const n = {
          rooms: toNumOrNull(u?.rooms),
          baths: toNumOrNull(u?.baths),
          hasLoft: !!(u?.hasLoft ?? u?.duplex),
          hasTerrace: !!(u?.hasTerrace ?? u?.terrace),
          minPrice: toNumOrNull(u?.minPrice ?? u?.primary),
          maxPrice: toNumOrNull(u?.maxPrice ?? u?.secondary),
          note: (u?.note ?? null) as string | null,
        };
        const hasAny =
          n.rooms != null ||
          n.baths != null ||
          n.hasLoft ||
          n.hasTerrace ||
          n.minPrice != null ||
          n.maxPrice != null ||
          (n.note ?? "") !== "";
        return hasAny
          ? {
              rooms: n.rooms,
              baths: n.baths,
              hasLoft: n.hasLoft,
              hasTerrace: n.hasTerrace,
              minPrice: n.minPrice,
              maxPrice: n.maxPrice,
              note: n.note ?? null,
            }
          : null;
      })
      .filter(Boolean) as NonNullable<UpdatePinDto["units"]>;
    (patch as any).units = units;
  }

  console.log("[toPinPatch] final patch:", patch);
  console.groupEnd();
  return patch as UpdatePinDto;
}

/* 🔧 무의미한 null/빈값 제거: 초기 스냅샷 기준으로 noop이면 dto에서 삭제 */
const stripNoopNulls = (dto: any, initial: any) => {
  const norm = (x: any) =>
    x === "" || x === null || x === undefined ? undefined : x;

  for (const k of Object.keys(dto)) {
    const v = dto[k];

    if (v === undefined) {
      delete dto[k];
      continue;
    }

    // 🔴 여기에서 parkingTypeId 도 같이 지워져버릴 수 있었음
    if (v === null && norm(initial?.[k]) === undefined) {
      // ✅ parkingTypeId 는 null 이라도 "의도적인 삭제"일 수 있으니 지우지 않는다
      if (k === "parkingTypeId") continue;
      delete dto[k];
      continue;
    }

    // ✅ directions / units 는 빈 배열이라도 보존
    if (Array.isArray(v) && v.length === 0) {
      if (k === "directions" || k === "units") continue;
      delete dto[k];
      continue;
    }
    if (typeof v === "object" && v && Object.keys(v).length === 0) {
      delete dto[k];
      continue;
    }
  }
  return dto;
};

/* ───────── component ───────── */
export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
  embedded = false,
}: Omit<PropertyEditModalProps, "open"> & { embedded?: boolean }) {
  const queryClient = useQueryClient();

  // 🔔 공통 알림 모달 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = useCallback((msg: string) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  }, []);

  // initialData 평탄화
  const normalizedInitial = useMemo(() => {
    const src = initialData as any;
    const v = src?.raw ?? src?.view ?? src ?? null;
    console.log("[init] normalizedInitial:", v);
    return v;
  }, [initialData]);

  // 브릿지: 최저실입/등기/핀종류 정규화 (⚠️ 건물타입은 추가 매핑 없이 그대로만 사용)
  const bridgedInitial = useMemo(() => {
    const src = normalizedInitial as any;
    if (!src) return null;

    const salePrice =
      src?.salePrice ??
      (src?.minRealMoveInCost != null
        ? String(src.minRealMoveInCost)
        : undefined);

    // buildingType/registry는 서버가 준 값 중에서 우리가 허용하는 라벨만 사용
    const rawBt =
      src?.buildingType ?? src?.registry ?? src?.propertyType ?? src?.type;
    const bt = normalizeBuildingType(rawBt);

    const initPinKind =
      src?.pinKind ?? (src?.badge ? mapBadgeToPinKind(src.badge) : undefined);

    const out = {
      ...src,
      ...(salePrice !== undefined ? { salePrice } : {}),
      ...(bt !== undefined ? { buildingType: bt, registry: bt } : {}),
      ...(initPinKind !== undefined ? { pinKind: initPinKind } : {}),
    };
    console.log("[init] bridgedInitial:", {
      id: out?.id,
      isNew: out?.isNew,
      isOld: out?.isOld,
      pinKind: out?.pinKind,
      badge: out?.badge,
      registry: out?.registry,
      buildingType: out?.buildingType,
    });
    return out;
  }, [normalizedInitial]);

  // id
  const propertyId = useMemo(() => {
    const src = initialData as any;
    const id = src?.id ?? src?.raw?.id ?? src?.view?.id ?? "";
    const s = String(id ?? "");
    console.log("[init] propertyId:", s);
    return s;
  }, [initialData]);

  // 이미지 초기값
  const initialImages = useMemo(() => {
    const v = bridgedInitial as any;
    if (!v) return null;
    const out = {
      imageFolders: v?.imageFolders ?? v?.imageCards ?? null,
      images: v?.images ?? null,
      imageCardCounts: v?.imageCardCounts ?? null,
      verticalImages:
        v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems ?? null,
      imagesVertical: v?.imagesVertical ?? null,
      fileItems: v?.fileItems ?? null,
    };
    console.log("[init] initialImages:", {
      hasFolders: !!out.imageFolders,
      hasVertical: !!out.verticalImages,
      files: Array.isArray(out.fileItems) ? out.fileItems.length : 0,
    });
    return out;
  }, [bridgedInitial]);

  // 이미지 훅
  const {
    imageFolders,
    verticalImages,
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
    groups,
    photosByGroup,
    mediaLoading,
    mediaError,
    reloadGroups,
    uploadToGroup,
    createGroupAndUpload,
    makeCover,
    reorder,
    moveToGroup,
    deletePhotos,
    queueGroupTitle,
    queueGroupSortOrder,
    queuePhotoCaption,
    queuePhotoSort,
    queuePhotoMove,
    hasImageChanges,
    commitImageChanges,
    commitPending,
  } = useEditImages({ propertyId, initial: initialImages });

  useEffect(() => {
    if (propertyId) reloadGroups(propertyId);
  }, [propertyId, reloadGroups]);

  const imagesProp = useMemo(
    () => ({
      imageFolders,
      verticalImages,
      registerImageInput,
      openImagePicker,
      onPickFilesToFolder,
      addPhotoFolder,
      removePhotoFolder,
      onChangeImageCaption,
      handleRemoveImage,
      onAddFiles,
      onChangeFileItemCaption,
      handleRemoveFileItem,
      groups,
      photosByGroup,
      mediaLoading,
      mediaError,
      reloadGroups,
      uploadToGroup,
      createGroupAndUpload,
      makeCover,
      reorder,
      moveToGroup,
      deletePhotos,
      queueGroupTitle,
      queueGroupSortOrder,
      queuePhotoCaption,
      queuePhotoSort,
      queuePhotoMove,
      hasImageChanges,
      commitImageChanges,
      commitPending,
    }),
    [
      imageFolders,
      verticalImages,
      registerImageInput,
      openImagePicker,
      onPickFilesToFolder,
      addPhotoFolder,
      removePhotoFolder,
      onChangeImageCaption,
      handleRemoveImage,
      onAddFiles,
      onChangeFileItemCaption,
      handleRemoveFileItem,
      groups,
      photosByGroup,
      mediaLoading,
      mediaError,
      reloadGroups,
      uploadToGroup,
      createGroupAndUpload,
      makeCover,
      reorder,
      moveToGroup,
      deletePhotos,
      queueGroupTitle,
      queueGroupSortOrder,
      queuePhotoCaption,
      queuePhotoSort,
      queuePhotoMove,
      hasImageChanges,
      commitImageChanges,
      commitPending,
    ]
  );

  // 폼 훅
  const f = useEditForm({ initialData: bridgedInitial });

  useEffect(() => {
    console.log("[form] mounted/useEditForm snapshot:", {
      title: f.title,
      pinKind: f.pinKind,
      buildingType: f.buildingType,
      parkingGrade: f.parkingGrade,
    });
  }, []); // mount 1회

  useEffect(() => {
    console.log("[form] pinKind changed:", f.pinKind);
  }, [f.pinKind]);

  /** 신축/구옥: 초기값은 isNew/isOld에서 유도, 기본 "new" */
  const initialBuildingGrade = useMemo<"new" | "old">(() => {
    const src = bridgedInitial as any;
    if (src?.isNew === true) return "new";
    if (src?.isOld === true) return "old";
    return "new";
  }, [bridgedInitial]);

  /** ✅ 초기 서버 응답에 isNew/isOld 존재했는지 추적 */
  const hadAgeFlags = useMemo(() => {
    const src = bridgedInitial as any;
    if (!src) return false;
    const hasNew = Object.prototype.hasOwnProperty.call(src, "isNew");
    const hasOld = Object.prototype.hasOwnProperty.call(src, "isOld");
    return hasNew || hasOld;
  }, [bridgedInitial]);

  const [buildingGrade, _setBuildingGrade] = useState<"new" | "old">(
    initialBuildingGrade
  );
  /** ✅ 사용자 터치 여부 */
  const [buildingGradeTouched, setBuildingGradeTouched] = useState(false);

  useEffect(() => {
    console.log(
      "[buildingGrade] sync from bridgedInitial:",
      initialBuildingGrade
    );
    _setBuildingGrade(initialBuildingGrade);
    setBuildingGradeTouched(false);
    // ❗ useEditForm 쪽 state 도 같이 맞춰줌
    f.setBuildingGrade(initialBuildingGrade);
  }, [initialBuildingGrade, f.setBuildingGrade]);

  const setBuildingGrade = useCallback(
    (v: "new" | "old") => {
      console.log("[Header] buildingGrade selected:", v);
      _setBuildingGrade(v);
      setBuildingGradeTouched(true);
      // useEditForm 내부 state 동기화
      f.setBuildingGrade(v);
    },
    [f.setBuildingGrade]
  );

  const headerForm = useMemo(
    () => ({
      title: f.title,
      setTitle: (v: string) => {
        console.log("[Header] title change:", v);
        f.setTitle(v);
      },
      parkingGrade: f.parkingGrade,
      setParkingGrade: (v: StarStr) => {
        const nv = normalizeStarStr(v);
        console.log("[Header] parkingGrade change:", v, "→", nv);
        f.setParkingGrade(nv);
      },
      elevator: f.elevator,
      setElevator: (v: any) => {
        console.log("[Header] elevator change:", v);
        f.setElevator(v);
      },
      pinKind: f.pinKind,
      setPinKind: (v: any) => {
        console.log("[Header] pinKind selected:", v);
        f.setPinKind(v);
      },
      buildingGrade, // "new" | "old"
      setBuildingGrade, // (v: "new" | "old") => void
    }),
    [
      f.title,
      f.setTitle,
      f.parkingGrade,
      f.setParkingGrade,
      f.elevator,
      f.setElevator,
      f.pinKind,
      f.setPinKind,
      buildingGrade,
      setBuildingGrade,
    ]
  );

  useEffect(() => {
    console.log("[headerForm] snapshot:", {
      buildingGrade: headerForm.buildingGrade,
      pinKind: headerForm.pinKind,
    });
  }, [headerForm]);

  // ParkingContainer 지연 마운트
  const [mountParking, setMountParking] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountParking(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Parking setters 프록시
  const setParkingTypeProxy = useCallback(
    (v: string | null) => {
      console.log("[Parking] type change:", v);
      f.setParkingType(v);
    },
    [f.setParkingType]
  );
  const setTotalParkingSlotsProxy = useCallback(
    (v: string | null) => {
      console.log("[Parking] total slots change:", v);
      f.setTotalParkingSlots(v ?? "");
    },
    [f.setTotalParkingSlots]
  );
  const setParkingTypeIdProxy = useCallback(
    (v: number | null) => {
      console.log("[Parking] typeId change:", v);
      f.setParkingTypeId(v);
    },
    [f.setParkingTypeId]
  );

  // Parking form 어댑터 (parkingTypeId 포함)
  const parkingForm: ParkingFormSlice = useMemo(
    () => ({
      parkingTypeId: f.parkingTypeId,
      setParkingTypeId: setParkingTypeIdProxy,

      parkingType: f.parkingType,
      setParkingType: setParkingTypeProxy,

      totalParkingSlots: (() => {
        const raw = f.totalParkingSlots;
        if (raw == null) return null;
        const s = String(raw).trim();
        return s === "" ? null : s;
      })(),
      setTotalParkingSlots: setTotalParkingSlotsProxy,
    }),
    [
      f.parkingTypeId,
      setParkingTypeIdProxy,
      f.parkingType,
      f.totalParkingSlots,
      setParkingTypeProxy,
      setTotalParkingSlotsProxy,
    ]
  );

  /** CompletionRegistryContainer용 어댑터 */
  const completionRegistryForm: CompletionRegistryFormSlice = useMemo(
    () => ({
      // 준공일
      completionDate: f.completionDate ?? "",
      setCompletionDate: (v: string) => {
        console.log("[Completion] date change:", v);
        f.setCompletionDate(v);
      },

      // ✅ 최저 실입 (타입에서 minRealMoveInCost로 요구)
      minRealMoveInCost: f.salePrice,
      setMinRealMoveInCost: (v: string | number | null) => {
        const s = v == null ? "" : String(v);
        console.log("[Completion] minRealMoveInCost change:", v, "→", s);
        f.setSalePrice(s);
      },

      // (기존 필드도 유지해두면 다른 곳에서 쓸 수 있음)
      salePrice: f.salePrice,
      setSalePrice: (v: string | number | null) => {
        const s = v == null ? "" : String(v);
        console.log("[Completion] salePrice change:", v, "→", s);
        f.setSalePrice(s);
      },

      // ✅ 엘리베이터 (CompletionRegistry 섹션에서 같이 쓰도록)
      elevator: f.elevator,
      setElevator: (v: any) => {
        console.log("[Completion] elevator change:", v);
        f.setElevator(v);
      },

      // 경사도
      slopeGrade: f.slopeGrade,
      setSlopeGrade: (v?: Grade) => {
        console.log("[Completion] slopeGrade change:", v);
        f.setSlopeGrade(() => v);
      },

      // 구조 등급
      structureGrade: f.structureGrade,
      setStructureGrade: (v?: Grade) => {
        console.log("[Completion] structureGrade change:", v);
        f.setStructureGrade(() => v);
      },

      // 등기/건물 타입
      buildingType: (normalizeBuildingType(f.buildingType) ??
        null) as BuildingType | null,
      setBuildingType: (v: string | null) => {
        const bt = normalizeBuildingType(v);
        console.log("[Completion] buildingType change:", v, "→", bt);
        f.setBuildingType(bt ?? null);
      },

      // ⭐ 리베이트 텍스트
      rebateText: f.rebateText ?? "",
      setRebateText: (v: string | null) => {
        const s = v ?? "";
        console.log("[Completion] rebateText change:", v, "→", s);
        f.setRebateText(s);
      },
    }),
    [
      f.completionDate,
      f.setCompletionDate,
      f.salePrice,
      f.setSalePrice,
      f.elevator,
      f.setElevator,
      f.slopeGrade,
      f.setSlopeGrade,
      f.structureGrade,
      f.setStructureGrade,
      f.buildingType,
      f.setBuildingType,
      f.rebateText,
      f.setRebateText,
    ]
  );

  const isSaveEnabled = f.isSaveEnabled;

  /** ✅ 편집 모달 내부 스크롤 컨테이너의 가로 스크롤 강제 리셋 */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollLeft !== 0) {
        el.scrollLeft = 0;
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  /** 저장 가능 여부: 폼 변경 or 이미지 변경 */
  const canSaveNow = useMemo(
    () => isSaveEnabled || hasImageChanges?.(),
    [isSaveEnabled, hasImageChanges]
  );

  /** 저장 */
  const save = useCallback(async () => {
    console.groupCollapsed("[save] start");
    console.log("[save] current buildingGrade:", buildingGrade);
    console.log(
      "[save] buildingGradeTouched:",
      buildingGradeTouched,
      "hadAgeFlags:",
      hadAgeFlags
    );
    console.log("[save] current pinKind:", f.pinKind);

    if (!f.title.trim()) {
      console.groupEnd();
      showAlert("이름(제목)을 입력하세요.");
      return;
    }

    // ✅ 전화번호 형식 검증
    if (!isValidPhoneKR(f.officePhone)) {
      console.groupEnd();
      showAlert("전화번호를 입력해주세요");
      return;
    }
    if ((f.officePhone2 ?? "").trim() && !isValidPhoneKR(f.officePhone2)) {
      console.groupEnd();
      showAlert("전화번호를 입력해주세요");
      return;
    }

    // ✅ 준공일 형식 검증
    {
      const raw = f.completionDate?.trim() ?? "";
      if (raw) {
        const normalized = normalizeDateInput(raw);
        if (normalized !== raw) f.setCompletionDate(normalized);
        if (!isValidIsoDateStrict(normalized)) {
          console.groupEnd();
          showAlert(
            "준공일은 YYYY-MM-DD 형식으로 입력해주세요.\n예: 2024-04-14"
          );
          return;
        }
      }
    }

    // ✅ 면적 제약
    {
      const msg = validateAreaRanges(f.baseAreaSet, f.extraAreaSets);
      if (msg) {
        console.groupEnd();
        showAlert(msg);
        return;
      }
    }

    // ✅ 유닛 가격 제약
    {
      const msg = validateUnitPriceRanges(f.unitLines);
      if (msg) {
        console.groupEnd();
        showAlert(msg);
        return;
      }
    }

    let dto: UpdatePinDto | null = null;
    let hasFormChanges = false;
    try {
      const raw = toPinPatch(f, bridgedInitial as InitialSnapshot);

      // 초기 데이터에 향/방향 값이 전무하면 이번 PATCH에서 삭제 (directions는 유지)
      const initAspectBundle = {
        aspect: (bridgedInitial as any)?.aspect,
        aspectNo: (bridgedInitial as any)?.aspectNo,
        aspect1: (bridgedInitial as any)?.aspect1,
        aspect2: (bridgedInitial as any)?.aspect2,
        aspect3: (bridgedInitial as any)?.aspect3,
        orientations: (bridgedInitial as any)?.orientations,
      };
      const _norm = (v: any) => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === "" || s === "-" || s === "—" ? undefined : s;
      };
      const initHasAspect =
        !!_norm(initAspectBundle.aspect) ||
        !!_norm(initAspectBundle.aspectNo) ||
        !!_norm(initAspectBundle.aspect1) ||
        !!_norm(initAspectBundle.aspect2) ||
        !!_norm(initAspectBundle.aspect3) ||
        (Array.isArray(initAspectBundle.orientations) &&
          initAspectBundle.orientations.length > 0);

      if (!initHasAspect) {
        delete (raw as any).aspect;
        delete (raw as any).aspectNo;
        delete (raw as any).aspect1;
        delete (raw as any).aspect2;
        delete (raw as any).aspect3;
        delete (raw as any).orientations;
      }

      dto = deepPrune(raw) as UpdatePinDto;

      // 🔧 무의미한 null/빈값 제거 + [] 방지 (directions/units 보존)
      dto = stripNoopNulls(dto, bridgedInitial) as UpdatePinDto;
      console.log(
        "[save] stripNoopNulls 이후 dto.areaGroups:",
        (dto as any).areaGroups
      );

      // ✅ 주차 유형: 폼 기준으로 항상 dto에 실어 보냄 (diff / prune 실패 방지)
      {
        const rawPt = (f as any).parkingTypeId;
        const numPt =
          rawPt == null || rawPt === ""
            ? null
            : Number(String(rawPt).replace(/[^\d.-]/g, ""));
        (dto as any).parkingTypeId =
          numPt === null || Number.isNaN(numPt) ? null : numPt;
        console.log("[save] forced dto.parkingTypeId from form:", {
          raw: rawPt,
          num: (dto as any).parkingTypeId,
        });
      }

      if (
        (dto as any)?.areaGroups &&
        Array.isArray((dto as any).areaGroups) &&
        (dto as any).areaGroups.length === 0
      ) {
        console.log("[save] areaGroups가 빈 배열 → 키 제거");
        delete (dto as any).areaGroups;
      }

      // ✅ buildingGrade → 서버로 보낼지 결정
      if (
        buildingGradeTouched ||
        !hadAgeFlags ||
        buildingGrade !== initialBuildingGrade
      ) {
        (dto as any).isNew = buildingGrade === "new";
        (dto as any).isOld = buildingGrade === "old";
      }

      console.log("[save] final toggles (diffed):", {
        buildingGrade,
        buildingGradeTouched,
        hadAgeFlags,
        isNew: (dto as any).isNew,
        isOld: (dto as any).isOld,
        pinKind: (dto as any).pinKind ?? f.pinKind,
        buildingType: (dto as any).buildingType,
        registry: (dto as any).registry,
      });

      hasFormChanges = hasMeaningfulPatch(dto);

      console.groupCollapsed("[save] after toPinPatch+strip (diffed only)");
      console.log("[save] dto:", dto);
      console.log("[save] hasFormChanges:", hasFormChanges);
      console.groupEnd();
    } catch (e: any) {
      console.error("[toPinPatch] 실패:", e);
      console.groupEnd();
      showAlert(e?.message || "변경 사항 계산 중 오류가 발생했습니다.");
      return;
    }

    // 1) 사진 커밋 (가로/세로 모두 포함, 변경 여부는 훅 내부에서 판단)
    try {
      await (commitImageChanges?.() ?? commitPending?.());
    } catch (e: any) {
      console.error("[images.commit] 실패:", e);
      console.groupEnd();
      showAlert(e?.message || "이미지 변경사항 반영에 실패했습니다.");
      return;
    }

    // 2) 폼 PATCH
    if (!(f as any).aspectsTouched && dto && (dto as any).directions) {
      delete (dto as any).directions;
    }

    if (hasFormChanges && dto && Object.keys(dto).length > 0) {
      console.log("[save] → will PATCH /pins/:id", propertyId, "with", dto);
      try {
        console.log("PATCH /pins/:id payload", dto);
        await updatePin(propertyId, dto);
        await queryClient.invalidateQueries({
          queryKey: ["pinDetail", propertyId],
        });
      } catch (e: any) {
        console.error("[PATCH /pins/:id] 실패:", e);
        console.groupEnd();
        showAlert(e?.message || "핀 수정 중 오류가 발생했습니다.");
        return;
      }
    } else {
      console.log("[save] no form changes → skip PATCH");
    }

    // 3) 로컬 view 갱신
    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      f.buildOrientation();
    const {
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,
    } = f.packAreas();

    const payload = buildUpdatePayload(
      {
        title: f.title,
        address: f.address,
        officeName: f.officeName,
        officePhone: f.officePhone,
        officePhone2: f.officePhone2,
        moveIn: f.moveIn,
        floor: f.floor,
        roomNo: f.roomNo,
        structure: f.structure,

        parkingGrade: f.parkingGrade,
        parkingTypeId: f.parkingTypeId,
        parkingType: f.parkingType,
        totalParkingSlots: f.totalParkingSlots,
        completionDate: f.completionDate,
        salePrice: f.salePrice,

        baseAreaSet: f.baseAreaSet,
        extraAreaSets: f.extraAreaSets,
        exclusiveArea,
        realArea,
        extraExclusiveAreas,
        extraRealAreas,
        baseAreaTitleOut,
        extraAreaTitlesOut,

        elevator: f.elevator,
        slopeGrade: f.slopeGrade,
        structureGrade: f.structureGrade,

        totalBuildings: f.totalBuildings,
        totalFloors: f.totalFloors,
        totalHouseholds: f.totalHouseholds,
        remainingHouseholds: f.remainingHouseholds,

        options: f.options,
        etcChecked: f.etcChecked,
        optionEtc: f.optionEtc,
        publicMemo: f.publicMemo,
        secretMemo: f.secretMemo,

        orientations, // 로컬 뷰용
        aspect: aspect ?? "",
        aspectNo: Number(aspectNo ?? 0),
        aspect1,
        aspect2,
        aspect3,
        unitLines: f.unitLines,

        imageFolders,
        verticalImages,

        pinKind: f.pinKind,
        buildingGrade, // "new" | "old"
        buildingType: f.buildingType as BuildingType | null,
      },
      // initial은 여기선 안 넣어서 "뷰용 payload"는 diff 안 쓰고 그대로 씀
      undefined
    );

    console.log("[save] onSubmit payload (view sync):", {
      buildingGrade,
      pinKind: f.pinKind,
      title: payload.title,
    });

    await onSubmit?.(payload as any);
    console.groupEnd();
    onClose();
  }, [
    f,
    bridgedInitial,
    propertyId,
    queryClient,
    onSubmit,
    onClose,
    imageFolders,
    verticalImages,
    commitImageChanges,
    commitPending,
    buildingGrade,
    buildingGradeTouched,
    hadAgeFlags,
    initialBuildingGrade,
    showAlert,
  ]);

  /* embedded 레이아웃 */
  if (embedded) {
    return (
      <>
        <div className="flex flex-col h-full">
          <HeaderContainer form={headerForm as any} onClose={onClose} />

          {/* ✅ 스크롤 컨테이너에 ref 연결 */}
          <div
            ref={scrollRef}
            className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-6 px-4 md:px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
          >
            <ImagesContainer images={imagesProp} />
            <div className="space-y-4 md:space-y-6 overflow-visible">
              <BasicInfoContainer form={f} />
              <NumbersContainer form={f} />
              {mountParking && <ParkingContainer form={parkingForm as any} />}
              <CompletionRegistryContainer form={completionRegistryForm} />
              <AspectsContainer form={f} />
              <AreaSetsContainer form={f} />
              <StructureLinesContainer form={f} />
              <OptionsContainer form={f} />
              <MemosContainer form={f} />
              <div className="h-16 md:hidden" />
            </div>
          </div>

          <FooterButtons onClose={onClose} onSave={save} canSave={canSaveNow} />
        </div>

        {/* 공통 알림 모달 */}
        <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>안내</DialogTitle>
              <DialogDescription asChild>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                  {alertMessage}
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAlertOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                확인
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  /* 기본 모달 레이아웃 */
  return (
    <>
      <div className="fixed inset-0 z-[1000] isolate">
        {/* 배경 딤 */}
        <div
          className="absolute inset-0 z-[1000] bg-black/40 pointer-events-auto"
          onClick={onClose}
          aria-hidden
        />
        {/* 모달 컨텐츠 */}
        <div className="absolute left-1/2 top-1/2 z-[1001] w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl flex flex-col pointer-events-auto overflow-hidden">
          <HeaderContainer form={headerForm as any} onClose={onClose} />

          {/* 🔧 embedded 버전과 동일하게 + ref 연결 */}
          <div
            ref={scrollRef}
            className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-6 px-4 md:px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
          >
            {/* 좌측: 이미지 */}
            <div className="relative z-[1]">
              <ImagesContainer images={imagesProp} />
            </div>

            {/* 우측: 폼 */}
            <div className="relative z-[2] space-y-4 md:space-y-6">
              <BasicInfoContainer form={f} />
              <NumbersContainer form={f} />
              {mountParking && <ParkingContainer form={parkingForm as any} />}
              <CompletionRegistryContainer form={completionRegistryForm} />
              <AspectsContainer form={f} />
              <AreaSetsContainer form={f} />
              <StructureLinesContainer form={f} />
              <OptionsContainer form={f} />
              <MemosContainer form={f} />
              <div className="h-16 md:hidden" />
            </div>
          </div>

          <FooterButtons onClose={onClose} onSave={save} canSave={canSaveNow} />
        </div>
      </div>

      {/* 공통 알림 모달 */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>안내</DialogTitle>
            <DialogDescription asChild>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {alertMessage}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setAlertOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              확인
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
