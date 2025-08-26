"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Phone, Pencil, Trash2, Check, Undo2 } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";

import type {
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";
import { PropertyViewDetails } from "@/features/properties/types/property-view";

import PropertyEditModal from "../PropertyEditModal/PropertyEditModal";

// 공용 컴포넌트 (뷰 전용 / 폼 공용)
import Field from "../../common/Field";
import MetaBlock from "../../common/MetaBlock";
import OrientationBadges from "./OrientationBadges";

import DisplayImagesSection from "../../common/view/DisplayImagesSection";
import DealBadges from "../../common/view/DealBadges";
import StarsRow from "../../common/view/StarsRow";
import StructureLinesList from "../../common/view/StructureLinesList";
import OptionsBadges from "../../common/view/OptionsBadges";
import MemoPanel from "../../common/view/MemoPanel";

// 뷰 유틸
import {
  loadInitialMode,
  persistMode,
  gradeToStars,
  starsToGrade,
  toInputDateString,
  formatDateOnly,
  formatRangeWithPy,
} from "./utils";

export type PropertyViewModalProps = {
  open: boolean;
  onClose: () => void;
  item: PropertyViewDetails;
  onAddFavorite?: () => void;
  onDelete?: () => Promise<void> | void;
  onSave?: (patch: Partial<PropertyViewDetails>) => Promise<void> | void;
};

export default function PropertyViewModal(props: PropertyViewModalProps) {
  if (!props.open) return null;
  return <PropertyViewModalBody {...props} />;
}

function PropertyViewModalBody({
  onClose,
  item,
  onAddFavorite,
  onDelete,
  onSave,
}: PropertyViewModalProps) {
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

  const imagesView = item.images ?? ["", "", "", ""];
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

  // ====== (뷰 내부의 임시 편집 상태들 — 외부 에딧모달과 별개) ======
  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const fileInputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
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

  // 외부 수정 모달 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PropertyViewDetails | null>(
    null
  );

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

  /**
   * ✅ 핵심: 수정 모달을 포털로 body에 렌더 (뷰 모달은 숨김)
   *  - 지도/다른 스택 컨텍스트 위로 강제
   */
  if (editOpen) {
    return createPortal(
      <PropertyEditModal
        open
        item={editTarget ?? item}
        onClose={() => setEditOpen(false)}
        onSubmit={async (patch) => {
          await onSave?.(patch as Partial<PropertyViewDetails>);
          setEditOpen(false);
        }}
      />,
      document.body
    );
  }

  // ===== View 모달 렌더 =====
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
            <DealBadges status={displayStatus} dealStatus={displayDeal} />
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
          {/* 좌: 이미지 (공용) */}
          <DisplayImagesSection
            images={isEditing ? images : imagesView}
            fileInputs={fileInputs}
            onPickFile={onPickFile}
            isEditing={isEditing}
          />

          {/* 우: View */}
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
                    arr.push({ no: Number.isNaN(n) ? 1 : n, dir: item.aspect });
                  }
                  return arr.length > 0 ? (
                    <div className="flex gap-6">
                      {arr.map((a) => (
                        <div key={a.no} className="flex gap-3">
                          <span className="h-9 flex items-center">
                            {a.no}호:
                          </span>
                          <span className="h-9 flex items-center">{a.dir}</span>
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
                <StarsRow value={gradeToStars(item.parkingGrade as any)} />
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
                {item.registry ?? "-"}
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
              <StructureLinesList lines={item.unitLines} />
            </div>

            <OptionsBadges
              options={item.options ?? []}
              optionEtc={item.optionEtc}
            />

            <MemoPanel
              mode={mode}
              publicMemo={item.publicMemo}
              secretMemo={item.secretMemo}
            />

            <MetaBlock item={item} />
          </div>
        </div>

        {/* 풋터 */}
        <div className="shrink-0 border-t px-5 py-3 flex items-center">
          <div className="text-[12px] text-muted-foreground" />
          <div className="ml-4 flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
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

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={onAddFavorite}
                disabled={!onAddFavorite}
                title="즐겨찾기"
              >
                즐겨찾기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
