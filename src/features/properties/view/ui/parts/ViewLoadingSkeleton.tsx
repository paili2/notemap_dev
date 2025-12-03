"use client";

type Props = {
  onClose: () => void;
  headingId: string;
};

export default function ViewLoadingSkeleton({ onClose, headingId }: Props) {
  return (
    <>
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 id={headingId} className="text-lg font-semibold">
            상세 정보를 불러오는 중…
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-3 h-9 hover:bg-muted"
            aria-label="닫기"
            title="닫기"
          >
            닫기
          </button>
        </div>
      </div>
      <div className="flex-1 grid place-items-center p-10">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <span className="animate-pulse text-base">
            상세 정보를 불러오는 중…
          </span>
          <div className="h-1.5 w-48 rounded bg-slate-200 overflow-hidden">
            <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] bg-slate-300" />
          </div>
        </div>
      </div>
    </>
  );
}
