import { Eye, MapPin, Plus, Trash2, X } from "lucide-react";
import { OverlayUIProps } from "../PinContextMenu.types";
import { ActionBtn } from "../ActionBtn/ActionBtn";

export const OverlayUI = ({
  address,
  mode,
  propertyId,
  onClose,
  onView,
  onCreate,
  onDelete,
}: OverlayUIProps) => {
  const disabled = !propertyId;

  return (
    <div
      className="
        relative w-[208px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]
      "
    >
      {/* 닫기(X) */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-zinc-700 hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>

      {/* 헤더: 주소 */}
      <div className="flex items-center gap-1.5 border-b border-black/10 px-2.5 py-2">
        <MapPin className="h-3.5 w-3.5 text-zinc-700" />
        <div className="max-w-[164px] truncate text-[11px] text-zinc-600">
          {address ?? "주소 정보 없음"}
        </div>
      </div>

      {/* 액션 */}
      <div className="p-1">
        <ActionBtn
          label="매물 생성"
          icon={<Plus className="h-4 w-4" />}
          onClick={onCreate}
        />

        {mode === "existing" && (
          <>
            <ActionBtn
              label="매물 보기"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => propertyId && onView?.(propertyId)}
              disabled={disabled}
            />

            <div className="my-1 h-px bg-black/10" />

            <ActionBtn
              label="매물 삭제"
              icon={<Trash2 className="h-4 w-4 text-red-600" />}
              onClick={() => propertyId && onDelete?.(propertyId)}
              disabled={disabled}
              danger
            />
          </>
        )}
      </div>
    </div>
  );
};
