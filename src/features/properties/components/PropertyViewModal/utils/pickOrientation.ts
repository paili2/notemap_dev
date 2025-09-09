export type OrientationLike = {
  dir?: string;
  direction?: string;
  value?: string;
};

export const pickOrientation = (
  o: OrientationLike | null | undefined
): string => o?.dir ?? o?.direction ?? o?.value ?? "";
