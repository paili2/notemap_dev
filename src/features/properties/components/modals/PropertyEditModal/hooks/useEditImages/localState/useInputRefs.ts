import { useCallback, useRef } from "react";

export function useInputRefs() {
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const inputRefCallbacks = useRef<
    Array<((el: HTMLInputElement | null) => void) | null>
  >([]);

  const getRegisterImageInput = useCallback((idx: number) => {
    if (inputRefCallbacks.current[idx]) return inputRefCallbacks.current[idx]!;
    const cb = (el: HTMLInputElement | null) => {
      if (imageInputRefs.current[idx] === el) return;
      imageInputRefs.current[idx] = el;
    };
    inputRefCallbacks.current[idx] = cb;
    return cb;
  }, []);

  const registerImageInput = useCallback(
    (idx: number, el?: HTMLInputElement | null) => {
      if (arguments.length >= 2) {
        if (imageInputRefs.current[idx] !== el) {
          imageInputRefs.current[idx] = el ?? null;
        }
        return;
      }
      return getRegisterImageInput(idx);
    },
    [getRegisterImageInput]
  ) as unknown as {
    (idx: number): (el: HTMLInputElement | null) => void;
    (idx: number, el: HTMLInputElement | null): void;
  };

  const openImagePicker = useCallback(
    (idx: number) => imageInputRefs.current[idx]?.click(),
    []
  );

  return {
    imageInputRefs,
    registerImageInput,
    openImagePicker,
  };
}
