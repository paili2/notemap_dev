"use client";
import { Trash2, Pencil } from "lucide-react";

export default function ActionsBar({
  onEdit,
  onDelete,
  onClose,
}: {
  onEdit?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-3 border-t flex items-center justify-between">
      <div className="flex gap-2">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-blue-600 hover:bg-blue-50"
            aria-label="수정"
            title="수정"
          >
            <Pencil className="h-4 w-4" />
            수정
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("정말 삭제할까요?")) return;
              await onDelete();
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-red-600 hover:bg-red-50"
            aria-label="삭제"
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 rounded-md border px-3 h-9 hover:bg-muted"
        aria-label="닫기"
        title="닫기"
      >
        닫기
      </button>
    </div>
  );
}
