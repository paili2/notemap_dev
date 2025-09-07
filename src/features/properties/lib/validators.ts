import { packRange, toM2 } from "./area";

/** 문자열이 공백이 아닌지 확인 */
export const filled = (s: string): boolean => s.trim().length > 0;

/** 최소/최대 값이 둘 다 채워져 있는지 확인 */
export const hasPair = (min: string, max: string): boolean =>
  filled(min) && filled(max);

/** 면적 문자열을 묶어서 packRange로 변환 */
export const setPack = (
  minM2: string,
  maxM2: string,
  minPy: string,
  maxPy: string
): string =>
  packRange(minM2.trim() || toM2(minPy), maxM2.trim() || toM2(maxPy));
