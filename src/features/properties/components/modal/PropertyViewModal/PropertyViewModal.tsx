// features/properties/components/modal/PropertyViewModal/PropertyViewModal.tsx
"use client";

import {
  X,
  Star,
  Phone,
  Pencil,
  Trash2,
  Check,
  Undo2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";
import PropertyEditModal from "../PropertyEditModal/PropertyEditModal";

// 공용 컴포넌트
import Field from "../../common/Field";
import MetaBlock from "../../common/MetaBlock";

// 뷰 전용 컴포넌트/유틸
import OrientationBadges from "./OrientationBadges";
import {
  loadInitialMode,
  persistMode,
  gradeToStars,
  starsToGrade,
  toInputDateString,
  formatDateOnly,
  formatRangeWithPy,
} from "./utils";
import { PropertyViewDetails } from "@/features/properties/types/property-view";

export type PropertyViewModalProps = {
  open: boolean;
  onClose: () => void;
  item: PropertyViewDetails;
  onAddFavorite?: () => void;
  onDelete?: () => Promise<void> | void;
  onSave?: (patch: Partial<PropertyViewDetails>) => Promise<void> | void;
};

export default function PropertyViewModal({
  open,
  onClose,
  item,
  onAddFavorite,
  onDelete,
  onSave,
}: PropertyViewModalProps) {
  if (!open) return null;

  // 공개/비밀 메모 토글
  const [mode, setMode] = useState<"KN" | "R">(loadInitialMode);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === "KN" ? "R" : "KN";
      persistMode(next);
      return next;
    });
  }, []);

  // 보기용 파생값
  const imagesView = item.images ?? ["", "", "", ""];
  const baseOptions = (item.options ?? []).filter(Boolean);

  // 콤마/전각 콤마/일본식 구분자
  const etcTags = String(item.optionEtc ?? "")
    .split(/[,\uFF0C\u3001]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const selectedOptionsView = Array.from(new Set([...baseOptions, ...etcTags]));
  const selectedRegistryView = item.registry ? [item.registry] : [];
  const parkingStarsView = gradeToStars(item.parkingGrade as any);

  const displayStatus = item.status ?? "공개";
  const displayDeal = item.dealStatus ?? "분양중";

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = window.confirm(
      "이 매물을 삭제할까요? 이 작업은 되돌릴 수 없습니다."
    );
    if (!ok) return;
    await onDelete();
  };

  // ====== Edit 폼 상태 ======
  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const fileInputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const pickImage = (idx: number) => fileInputs[idx].current?.click();
  const onPickFile = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImages((prev) => {
      const next = [...prev];
      next[idx] = url;
      return next;
    });
  };

  const [title, setTitle] = useState(item.title ?? "");
  const [address, setAddress] = useState(item.address ?? "");
  const [officePhone, setOfficePhone] = useState(item.officePhone ?? "");
  const [officePhone2, setOfficePhone2] = useState(item.officePhone2 ?? "");
  const [jeonsePrice, setJeonsePrice] = useState(item.jeonsePrice ?? "");
  const [elevator, setElevator] = useState<"O" | "X">(item.elevator ?? "O");

  const [aspect1, setAspect1] = useState(item.aspect1 ?? "");
  const [aspect2, setAspect2] = useState(item.aspect2 ?? "");
  const [aspect3, setAspect3] = useState(item.aspect3 ?? "");
  const [parkingType, setParkingType] = useState<string>(
    item.parkingType ?? "답사지 확인"
  );
  const [completionDate, setCompletionDate] = useState<string>(
    toInputDateString(item.completionDate)
  );

  const [totalBuildings, setTotalBuildings] = useState(
    item.totalBuildings !== undefined ? String(item.totalBuildings) : ""
  );
  const [totalFloors, setTotalFloors] = useState(
    item.totalFloors !== undefined ? String(item.totalFloors) : ""
  );
  const [totalHouseholds, setTotalHouseholds] = useState(
    item.totalHouseholds !== undefined ? String(item.totalHouseholds) : ""
  );
  const [remainingHouseholds, setRemainingHouseholds] = useState(
    item.remainingHouseholds !== undefined
      ? String(item.remainingHouseholds)
      : ""
  );

  const [parkingStars, setParkingStars] = useState<number>(
    gradeToStars(item.parkingGrade)
  );

  const [options, setOptions] = useState<string[]>(item.options ?? []);
  const [optionEtc, setOptionEtc] = useState(item.optionEtc ?? "");
  const toggleOption = (name: string) =>
    setOptions((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );

  const [registry, setRegistry] = useState<Registry>(item.registry ?? "주택");

  const [slopeGrade, setSlopeGrade] = useState<
    PropertyViewDetails["slopeGrade"]
  >(item.slopeGrade ?? "상");
  const [structureGrade, setStructureGrade] = useState<
    PropertyViewDetails["structureGrade"]
  >(item.structureGrade ?? "상");

  const [unitLines, setUnitLines] = useState<UnitLine[]>(item.unitLines ?? []);
  const parsePreset = (s: string) => {
    const [r, b] = s.split("/").map((n) => parseInt(n, 10));
    return { rooms: r || 0, baths: b || 0 };
  };
  const addLineFromPreset = (preset: string) => {
    const { rooms, baths } = parsePreset(preset);
    setUnitLines((prev) => [
      ...prev,
      {
        rooms,
        baths,
        duplex: false,
        terrace: false,
        primary: "",
        secondary: "",
      },
    ]);
  };
  const addEmptyLine = () => {
    setUnitLines((prev) => [
      ...prev,
      {
        rooms: 0,
        baths: 0,
        duplex: false,
        terrace: false,
        primary: "",
        secondary: "",
      },
    ]);
  };
  const updateLine = (idx: number, patch: Partial<UnitLine>) => {
    setUnitLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  };
  const removeLine = (idx: number) => {
    setUnitLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const [publicMemo, setPublicMemo] = useState(item.publicMemo ?? "");
  const [secretMemo, setSecretMemo] = useState(item.secretMemo ?? "");
  const memoValue = mode === "KN" ? publicMemo : secretMemo;
  const setMemoValue = (v: string) =>
    mode === "KN" ? setPublicMemo(v) : setSecretMemo(v);

  useEffect(() => {
    setTitle(item.title ?? "");
    setAddress(item.address ?? "");
    setOfficePhone(item.officePhone ?? "");
    setOfficePhone2(item.officePhone2 ?? "");
    setJeonsePrice(item.jeonsePrice ?? "");
    setElevator(item.elevator ?? "O");

    setAspect1(item.aspect1 ?? "");
    setAspect2(item.aspect2 ?? "");
    setAspect3(item.aspect3 ?? "");

    setParkingType(item.parkingType ?? "답사지 확인");
    setCompletionDate(toInputDateString(item.completionDate));

    setTotalBuildings(
      item.totalBuildings !== undefined ? String(item.totalBuildings) : ""
    );
    setTotalFloors(
      item.totalFloors !== undefined ? String(item.totalFloors) : ""
    );
    setTotalHouseholds(
      item.totalHouseholds !== undefined ? String(item.totalHouseholds) : ""
    );
    setRemainingHouseholds(
      item.remainingHouseholds !== undefined
        ? String(item.remainingHouseholds)
        : ""
    );

    setOptions(item.options ?? []);
    setOptionEtc(item.optionEtc ?? "");
    setRegistry(item.registry ?? "주택");
    setSlopeGrade(item.slopeGrade ?? "상");
    setStructureGrade(item.structureGrade ?? "상");
    setUnitLines(item.unitLines ?? []);
    setPublicMemo(item.publicMemo ?? "");
    setSecretMemo(item.secretMemo ?? "");
    setImages([0, 1, 2, 3].map((i) => (item.images ?? [])[i] ?? ""));
  }, [item]);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PropertyViewDetails | null>(
    null
  );

  useEffect(() => {
    if (open) setIsEditing(false);
  }, [open]);

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    if (!onSave) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      const patch: Partial<PropertyViewDetails> = {
        title,
        address,
        officePhone,
        officePhone2,
        aspect1,
        aspect2,
        aspect3,
        parkingType,
        parkingGrade: starsToGrade(parkingStars),
        completionDate,
        jeonsePrice,
        elevator,
        totalBuildings,
        totalFloors,
        totalHouseholds,
        remainingHouseholds,
        options,
        optionEtc,
        registry,
        unitLines,
        publicMemo,
        secretMemo,
        images,
        slopeGrade,
        structureGrade,
      };
      await onSave(patch);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const stripManual = (v?: string | number) => {
    if (v === undefined || v === null) return "-";
    const s = String(v);
    return s.replace(/\s*\(직접입력\)\s*$/, "");
  };

  const orientationView = useMemo(() => {
    if (item.orientations && item.orientations.length > 0) {
      return [...item.orientations].sort((a, b) => a.ho - b.ho);
    }
    const fallback: { ho: number; value: string }[] = [];
    if (item.aspect1) fallback.push({ ho: 1, value: item.aspect1 });
    if (item.aspect2) fallback.push({ ho: 2, value: item.aspect2 });
    if (item.aspect3) fallback.push({ ho: 3, value: item.aspect3 });
    if (fallback.length === 0 && item.aspect) {
      const n = parseInt(
        String(item.aspectNo ?? "").replace(/\D/g, "") || "1",
        10
      );
      fallback.push({ ho: Number.isNaN(n) ? 1 : n, value: item.aspect });
    }
    return fallback;
  }, [
    item.orientations,
    item.aspect1,
    item.aspect2,
    item.aspect3,
    item.aspect,
    item.aspectNo,
  ]);

  return (
    <div className="fixed inset-0 z-[110]">
      {/* 배경 딤 */}
      <div
        className="absolute inset-0 bg-black/40 z-10"
        onClick={onClose}
        aria-hidden
      />
      {/* 패널 */}
      <div
        className="
          absolute left-1/2 top-1/2 w-[980px] max-w-[95vw] max-h-[92vh]
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col
          z-20
        "
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {isEditing ? title || "매물 수정" : item.title || "매물"}
            </h2>
            <Badge variant="secondary">{displayStatus}</Badge>
            <Badge
              variant={displayDeal === "계약완료" ? "destructive" : "outline"}
            >
              {displayDeal}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "R" ? "outline" : "secondary"}
              onClick={toggleMode}
              title={mode === "KN" ? "K&N (공개 메모)" : "R (비밀 메모)"}
              className={cn(
                "h-8 px-3 text-sm",
                mode === "R" ? " bg-rose-600 text-white" : ""
              )}
            >
              {mode === "KN" ? "K&N" : "R"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="닫기">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 바디 */}
        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          {/* 좌: 이미지 */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => {
              const isContract = i === 3;
              const url = isEditing ? images[i] : imagesView[i];
              return (
                <div
                  key={i}
                  className={cn(
                    "relative rounded-lg overflow-hidden border bg-muted/30",
                    isContract ? "h-[360px]" : "h-[160px]"
                  )}
                >
                  <div className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                    {isContract ? "파일" : `사진 ${i + 1}`}
                  </div>
                  {url ? (
                    <img
                      src={url}
                      alt={isContract ? "contract" : `photo-${i}`}
                      className={cn(
                        "block w-full h-full",
                        isContract ? "object-contain bg-white" : "object-cover"
                      )}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      이미지 없음
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <div className="absolute right-2 bottom-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => pickImage(i)}
                        >
                          {images[i] ? "수정" : "업로드"}
                        </Button>
                      </div>
                      <input
                        ref={fileInputs[i]}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickFile(i, e)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 우: View / Edit */}
          {!isEditing ? (
            /* ===== View ===== */
            <div className="space-y-6 text-[13px]">
              <div className="h-9 grid grid-cols-2 gap-3">
                <Field label="주소">
                  <div className="h-9 flex items-center">
                    {item.address ?? "-"}
                  </div>
                </Field>
                <Field label="엘리베이터">
                  <div className="h-9 flex items-center">
                    {item.elevator ?? "O"}
                  </div>
                </Field>
              </div>

              <Field label="분양사무실">
                <div className="h-9 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="px-2 py-1 rounded bg-white">
                      {item.officePhone ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="px-2 py-1 rounded bg-white">
                      {item.officePhone2 ?? "-"}
                    </span>
                  </div>
                </div>
              </Field>

              <div className="h-9 grid grid-cols-2 gap-3">
                <Field label="총 개동">
                  <div className="h-9 flex items-center">
                    {stripManual(item.totalBuildings)}
                  </div>
                </Field>
                <Field label="총 층수">
                  <div className="h-9 flex items-center">
                    {stripManual(item.totalFloors)}
                  </div>
                </Field>
              </div>

              <div className="h-9 grid grid-cols-2 gap-3">
                <Field label="총 세대수">
                  <div className="h-9 flex items-center">
                    {stripManual(item.totalHouseholds)}
                  </div>
                </Field>
                <Field label="잔여세대">
                  <div className="h-9 flex items-center">
                    {stripManual(item.remainingHouseholds)}
                  </div>
                </Field>
              </div>

              <Field label="향">
                {Array.isArray(item.orientations) &&
                item.orientations.length > 0 ? (
                  <OrientationBadges data={item.orientations} />
                ) : (
                  (() => {
                    const arr: { no: number; dir: string }[] = [];
                    if (item.aspect1) arr.push({ no: 1, dir: item.aspect1 });
                    if (item.aspect2) arr.push({ no: 2, dir: item.aspect2 });
                    if (item.aspect3) arr.push({ no: 3, dir: item.aspect3 });
                    if (arr.length === 0 && item.aspect) {
                      const n = parseInt(
                        String(item.aspectNo ?? "").replace(/\D/g, "") || "1",
                        10
                      );
                      arr.push({
                        no: Number.isNaN(n) ? 1 : n,
                        dir: item.aspect,
                      });
                    }
                    return arr.length > 0 ? (
                      <div className="flex gap-6">
                        {arr.map((a) => (
                          <div key={a.no} className="flex gap-3">
                            <span className="h-9 flex items-center">
                              {a.no}호:
                            </span>
                            <span className="h-9 flex items-center">
                              {a.dir}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-9 flex items-center">-</div>
                    );
                  })()
                )}
              </Field>

              <div className="grid grid-cols-2 gap-6">
                <Field label="주차유형">
                  <div className="h-9 flex items-center">
                    {item.parkingType ?? "답사지 확인"}
                  </div>
                </Field>
                <Field label="주차평점">
                  <div className="h-9 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = i < parkingStarsView;
                      return (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            filled
                              ? "fill-current text-yellow-500"
                              : "text-gray-300"
                          )}
                        />
                      );
                    })}
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Field label="준공일">
                  {formatDateOnly(item.completionDate)}
                </Field>
                <Field label="최저실입">
                  <div className="h-9 flex items-center">
                    {item.jeonsePrice ?? "-"}
                  </div>
                </Field>
              </div>

              <Field label="전용">
                <div className="h-9 flex items-center">
                  {formatRangeWithPy(item.exclusiveArea)}
                </div>
              </Field>
              <Field label="실평">
                <div className="h-9 flex items-center">
                  {formatRangeWithPy(item.realArea)}
                </div>
              </Field>

              <Field label="등기">
                <div className="h-9 flex items-center">
                  {selectedRegistryView.length
                    ? selectedRegistryView.join(", ")
                    : "-"}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-6">
                <Field label="경사도">
                  <div className="flex items-center gap-1">
                    <span className="px-3 py-1 rounded-md bg-blue-700 text-white font-semibold shadow-sm">
                      {item.slopeGrade ?? "상"}
                    </span>
                  </div>
                </Field>
                <Field label="구조(등급)">
                  <div className="flex items-center gap-1">
                    <span className="px-3 py-1 rounded-md bg-blue-700 text-white font-semibold shadow-sm">
                      {item.structureGrade ?? "상"}
                    </span>
                  </div>
                </Field>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">구조별 입력</div>
                {(item.unitLines?.length ?? 0) === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    3/2 복층 테라스
                  </div>
                ) : (
                  <div className="space-y-1">
                    {item.unitLines!.map((l, idx) => (
                      <div
                        key={idx}
                        className="rounded border px-2 py-1 text-xs flex flex-wrap items-center gap-2"
                      >
                        <span>
                          {l.rooms}/{l.baths}
                        </span>
                        <span className="opacity-60">|</span>
                        <span>복층 {l.duplex ? "O" : "X"}</span>
                        <span className="opacity-60">|</span>
                        <span>테라스 {l.terrace ? "O" : "X"}</span>
                        {(l.primary || l.secondary) && (
                          <>
                            <span className="opacity-60">|</span>
                            <span>
                              {l.primary || "-"} / {l.secondary || "-"}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedOptionsView.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">옵션</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedOptionsView.map((op) => (
                      <Badge key={op} variant="secondary">
                        {op}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {mode === "KN" ? (
                <div className="rounded-md border bg-amber-50/60 p-3">
                  <div className="text-sm font-medium mb-1">특이사항(공개)</div>
                  <div className="whitespace-pre-wrap text-[13px]">
                    {item.publicMemo ?? "공개 가능한 메모"}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border bg-rose-50/70 p-3">
                  <div className="text-sm font-medium mb-1 text-rose-600">
                    리베이트 / 비밀 메모 (R)
                  </div>
                  <div className="whitespace-pre-wrap text-[13px]">
                    {item.secretMemo ?? "내부 메모"}
                  </div>
                </div>
              )}

              <MetaBlock item={item} />
            </div>
          ) : (
            /* ===== Edit ===== */
            <div className="space-y-6">
              {/* (편집 섹션: 기존 코드 유지) */}
              {/* ... 중략 (질문 내용의 Edit 섹션 그대로) ... */}
            </div>
          )}
        </div>

        {/* 풋터 */}
        <div className="shrink-0 border-t px-5 py-3 flex items-center">
          <div className="text-[12px] text-muted-foreground" />
          <div className="ml-4 flex-1 flex items-center justify-between">
            {!isEditing ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // 외부 Edit 모달 사용
                    setEditTarget(item);
                    setEditOpen(true);
                  }}
                  title="수정"
                  className="border-none shadow-transparent w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  title="삭제"
                  disabled={!onDelete}
                  className={cn(
                    "border-none shadow-transparent text-rose-600 hover:bg-rose-50 w-8",
                    !onDelete && "opacity-60"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  title="취소"
                  className="border-none shadow-transparent"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={saving || !title.trim()}
                  title="저장"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? "저장중..." : "저장"}
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="secondary"
                  onClick={onAddFavorite}
                  disabled={!onAddFavorite}
                  title="즐겨찾기"
                >
                  즐겨찾기
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 외부 수정 모달 */}
      {editOpen && (
        <PropertyEditModal
          open={editOpen}
          item={editTarget ?? item}
          onClose={() => setEditOpen(false)}
          onSubmit={async (patch) => {
            await onSave?.(patch as Partial<PropertyViewDetails>);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
