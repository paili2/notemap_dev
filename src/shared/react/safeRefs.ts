import {
  MutableRefObject,
  Ref,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
} from "react";

/** 동일 엘리먼트면 아무 것도 안 하는 안전 ref 콜백 */
export function useStableRefCallback<T extends HTMLElement>(
  outRef?: MutableRefObject<T | null> | RefCallback<T | null> | null
) {
  const cb = useCallback<RefCallback<T | null>>(
    (el) => {
      if (typeof outRef === "function") {
        outRef(el);
      } else if (outRef && "current" in (outRef as any)) {
        const cur = (outRef as MutableRefObject<T | null>).current;
        if (cur === el) return; // 동일 노드면 리턴
        (outRef as MutableRefObject<T | null>).current = el;
      }
    },
    [outRef]
  );
  return cb;
}

/** 여러 ref를 합치되, 합쳐진 콜백의 아이덴티티를 고정 */
export function useMergedRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  // 안정 refs만 넣는다는 전제에서 아이덴티티 고정
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    return (node: T) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === "function") ref(node);
        else (ref as MutableRefObject<T | null>).current = node as any;
      });
    };
  }, []);
}

/** boolean setter를 동등성 가드로 감싸서 동일 값 재설정을 막음 */
export function useBooleanGuardSetter(cb: (v: boolean) => void) {
  const lastRef = useRef<boolean | undefined>(undefined);
  return useCallback(
    (next: boolean) => {
      if (lastRef.current === next) return;
      lastRef.current = next;
      cb(next);
    },
    [cb]
  );
}

/** 임의 값 setter를 Object.is 가드로 감싸서 동일 값 재설정을 막음 */
export function useGuardedSetter<T>(cb: (v: T) => void) {
  const lastRef = useRef<T | undefined>(undefined);
  return useCallback(
    (next: T) => {
      if (Object.is(lastRef.current, next)) return;
      lastRef.current = next;
      cb(next);
    },
    [cb]
  );
}
