"use client";

import { defined, normalizeShallow, jsonEq, deepEq } from "./utils";

export type PatchTarget = Record<string, any>;
export type InitialLike = Record<string, any> | undefined;

export type PatchHelpers = {
  put: (key: string, next: any, prev?: any) => void;
  putAllowNull: (key: string, next: any, prev?: any) => void;
  putKeepEmptyArray: (
    key: string,
    next: any[] | undefined,
    prev?: any[] | undefined
  ) => void;
  putAny: (key: string, next: any, prev?: any) => void;
};

export function createPatchHelpers(
  patch: PatchTarget,
  initial: InitialLike
): PatchHelpers {
  const put = (key: string, next: any, prev?: any) => {
    const nNext = normalizeShallow(next);
    const nPrev = normalizeShallow(prev);
    if (!defined(nNext)) return;
    if (!initial) patch[key] = nNext;
    else if (!jsonEq(nPrev, nNext)) patch[key] = nNext;
  };

  const putAllowNull = (key: string, next: any, prev?: any) => {
    if (next === undefined) return;
    if (!initial) patch[key] = next;
    else if (!deepEq(prev, next)) patch[key] = next;
  };

  const putKeepEmptyArray = (
    key: string,
    next: any[] | undefined,
    prev?: any[] | undefined
  ) => {
    if (next === undefined) return;
    if (!initial) patch[key] = next;
    else if (!deepEq(prev, next)) patch[key] = next;
  };

  const putAny = (key: string, next: any, prev?: any) => {
    const nNext = normalizeShallow(next);
    const nPrev = normalizeShallow(prev);
    if (!defined(nNext)) return;
    if (!initial) patch[key] = nNext;
    else if (!jsonEq(nPrev, nNext)) patch[key] = nNext;
  };

  return { put, putAllowNull, putKeepEmptyArray, putAny };
}
