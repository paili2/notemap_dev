"use client";
import { useEffect, useMemo, useState } from "react";
import type { FavorateListItem } from "../types/sidebar";
import type { MouseEvent as ReactMouseEvent } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  groups: FavorateListItem[];
  onSelectGroup: (groupId: string) => void; // 기존 그룹 선택
  onCreateGroup: (groupId: string) => void; // 새 그룹 생성 + 자동 추가
};

export default function FavGroupModal({
  open,
  onClose,
  groups,
  onSelectGroup,
  onCreateGroup,
}: Props) {
  const [newGroupId, setNewGroupId] = useState("");
  const valid = useMemo(() => /^[0-9]{4}$/.test(newGroupId), [newGroupId]);

  useEffect(() => {
    if (!open) setNewGroupId("");
  }, [open]);

  if (!open) return null;

  const handleBackdropMouseDown = () => onClose();
  const stop = (e: ReactMouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="w-[360px] rounded-xl bg-white p-4 shadow-2xl"
        onMouseDown={stop}
        onClick={stop}
        role="dialog"
        aria-modal="true"
        aria-label="즐겨찾기 그룹 선택"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">즐겨찾기 그룹 선택</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            닫기
          </button>
        </div>

        {/* 그룹 목록 */}
        <div className="space-y-1 max-h-[220px] overflow-y-auto">
          {groups.length === 0 ? (
            <div className="text-sm text-gray-500">아직 그룹이 없습니다.</div>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGroup(g.title)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 border border-gray-200"
              >
                <div className="font-medium">{g.title}</div>
                <div className="text-xs text-gray-500">
                  {g.subItems.length}개 저장됨
                </div>
              </button>
            ))
          )}
        </div>

        {/* 새 그룹 만들기 */}
        <div className="mt-4 border-t pt-3">
          <label className="text-sm text-gray-600">
            새 그룹 만들기 (고객번호 뒤 4자리)
          </label>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) return;
              onCreateGroup(newGroupId); // ✅ 생성 + 자동 추가 + 닫힘
              setNewGroupId("");
            }}
          >
            <input
              value={newGroupId}
              onChange={(e) =>
                setNewGroupId(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="예: 7342"
              className="flex-1 rounded-lg border px-3 py-2"
              inputMode="numeric"
              maxLength={4}
            />
            <button
              type="submit"
              disabled={!valid}
              className={`px-3 py-2 rounded-lg ${
                valid
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              생성
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
