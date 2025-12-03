// 공통 유틸 (photoGroups / photos 둘 다 사용)

import type { AxiosError } from "axios";
import type { IdLike } from "@/shared/api/photos/types";

/** 숫자로 변환 가능하면 number, 아니면 원본 그대로 */
export const toKey = (v: IdLike) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};

export const assertArray = <T>(v: unknown, msg: string): T[] => {
  if (!v || !Array.isArray(v)) throw new Error(msg);
  return v as T[];
};

export const is409 = (e: unknown) => {
  const err = e as AxiosError<any>;
  return !!(err?.response && err.response.status === 409);
};
