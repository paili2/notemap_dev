import { useCallback, useState } from "react";
import { createPinDraft, type CreatePinDraftDto } from "@/shared/api/pins";

// createPinDraft의 반환값을 그대로 타입으로 사용
type PinDraft = Awaited<ReturnType<typeof createPinDraft>>;

export function usePinDraft() {
  const [creating, setCreating] = useState(false);
  const [lastDraft, setLastDraft] = useState<PinDraft | null>(null);

  const createDraft = useCallback(async (dto: CreatePinDraftDto) => {
    setCreating(true);
    try {
      const draft = await createPinDraft(dto);
      setLastDraft(draft);
      return draft;
    } finally {
      setCreating(false);
    }
  }, []);

  return { creating, lastDraft, createDraft };
}
