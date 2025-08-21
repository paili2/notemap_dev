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
import { Input } from "@/components/atoms/Input/Input";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Label } from "@/components/atoms/Label/Label";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  OrientationRow,
  PropertyViewDetails,
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";
import PropertyEditModal from "../PropertyEditModal/PropertyEditModal";

/* ====== 유틸/상수 ====== */
function fmt(d?: string | Date) {
  if (!d) return "-";
  let date: Date | null = null;

  if (typeof d === "string") {
    const try1 = new Date(d);
    if (!isNaN(try1.getTime())) {
      date = try1;
    } else {
      const m = d
        .trim()
        .match(
          /^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?$/
        );
      if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const dd = parseInt(m[3], 10);
        const hh = m[4] ? parseInt(m[4], 10) : 0;
        const mm = m[5] ? parseInt(m[5], 10) : 0;
        date = new Date(y, mo, dd, hh, mm);
      }
    }
  } else {
    date = d;
  }

  if (!date || isNaN(date.getTime())) return typeof d === "string" ? d : "-";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}.${m}.${dd} ${hh}:${mm}`;
}

function toInputDateString(d?: string | Date) {
  if (!d) return "";
  if (typeof d === "string") return d;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}.${m}.${dd}`;
}

const show = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s ? s : "-";
};

const ALL_OPTIONS = [
  "에어컨",
  "냉장고",
  "김치냉장고",
  "세탁기",
  "건조기",
  "공기순환기",
  "건조대",
  "식기세척기",
  "스타일러",
  "시스템장",
  "비데",
  "붙박이",
  "개별창고",
] as const;

const STRUCTURE_PRESETS = ["1/1", "2/1", "3/1", "3/2", "4/2", "4/3"] as const;

/* 모드(KN/R)만 기억 */
const MODE_KEY = "propertyView:mode";
function loadInitialMode(): "KN" | "R" {
  if (typeof window === "undefined") return "KN";
  const saved = window.localStorage.getItem(MODE_KEY);
  return saved === "R" ? "R" : "KN";
}

type Grade = "상" | "중" | "하";
const gradeToStars = (g?: Grade) =>
  g === "상" ? 5 : g === "중" ? 3 : g === "하" ? 1 : 0;
const starsToGrade = (n: number): Grade | undefined =>
  n >= 4 ? "상" : n >= 2 ? "중" : n > 0 ? "하" : undefined;

function formatDateOnly(dateStr?: string | Date) {
  if (!dateStr) return "-";
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, "0");
    const day = String(dateStr.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }
  // 문자열이면 그대로(백엔드가 "2024.04.14" 형태로 줄 수 있음)
  return dateStr;
}

/* ==== 전용/실평 범위 표시 유틸 (m² + 평) ==== */
const PYEONG = 3.3058;
const toPy = (m2?: string) => {
  const n = parseFloat(String(m2 ?? "").trim());
  return Number.isFinite(n) ? (n / PYEONG).toFixed(2) : "";
};
const parseRange = (s?: string): { min: string; max: string } => {
  const raw = (s || "").trim();
  if (!raw) return { min: "", max: "" };
  if (raw.includes("~")) {
    const [a, b] = raw.split("~");
    return { min: (a || "").trim(), max: (b || "").trim() };
  }
  // 단일값도 허용
  return { min: raw, max: "" };
};
const formatRangeWithPy = (s?: string) => {
  const { min, max } = parseRange(s);
  const hasMin = !!min.trim();
  const hasMax = !!max.trim();
  if (!hasMin && !hasMax) return "-";

  const minPy = hasMin ? toPy(min) : "";
  const maxPy = hasMax ? toPy(max) : "";

  if (hasMin && hasMax) {
    return `${min}~${max} m² (${minPy}~${maxPy} 평)`;
  }
  if (hasMin) {
    return `${min}~ m² (${minPy}~ 평)`;
  }
  return `~${max} m² (~${maxPy} 평)`;
};

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

  // 공개/비밀 메모 토글 (로컬스토리지에만 기억)
  const [mode, setMode] = useState<"KN" | "R">(loadInitialMode);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === "KN" ? "R" : "KN";
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(MODE_KEY, next);
        }
      } catch {}
      return next;
    });
  }, []);

  // 보기용 파생값
  const imagesView = item.images ?? ["", "", "", ""];
  const baseOptions = (item.options ?? []).filter(Boolean);

  // 콤마(,) 뿐 아니라 전각 콤마(，), 일본식 구분자(、)도 지원
  const etcTags = String(item.optionEtc ?? "")
    .split(/[,\uFF0C\u3001]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // 중복 제거(Set) + 최종 표시용
  const selectedOptionsView = Array.from(new Set([...baseOptions, ...etcTags]));
  const selectedRegistryView = item.registry ? [item.registry] : [];
  const parkingStarsView = gradeToStars(item.parkingGrade as any);

  // 게시상태/거래상태 배지용
  const displayStatus = item.status ?? "공개";
  const displayDeal = item.dealStatus ?? "분양중";

  // 삭제
  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = window.confirm(
      "이 매물을 삭제할까요? 이 작업은 되돌릴 수 없습니다."
    );
    if (!ok) return;
    await onDelete();
  };

  // ====== Edit 폼 상태 ======
  // 좌측 이미지(4칸)
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

  // 우측 입력 필드들 (편집 모드)
  const [title, setTitle] = useState(item.title ?? "");
  const [address, setAddress] = useState(item.address ?? "");
  const [officePhone, setOfficePhone] = useState(item.officePhone ?? "");
  const [officePhone2, setOfficePhone2] = useState(item.officePhone2 ?? "");
  const [jeonsePrice, setJeonsePrice] = useState(item.jeonsePrice ?? "");
  const [elevator, setElevator] = useState<"O" | "X">(item.elevator ?? "O");

  // 향(1/2/3호), 주차유형, 준공일
  const [aspect1, setAspect1] = useState(item.aspect1 ?? "");
  const [aspect2, setAspect2] = useState(item.aspect2 ?? "");
  const [aspect3, setAspect3] = useState(item.aspect3 ?? "");
  const [parkingType, setParkingType] = useState<string>(
    item.parkingType ?? "답사지 확인"
  );
  const [completionDate, setCompletionDate] = useState<string>(
    toInputDateString(item.completionDate)
  );

  // 개동/층수/세대수/잔여세대
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

  // 별점(예시용 내부 상태)
  const [parkingStars, setParkingStars] = useState<number>(
    gradeToStars(item.parkingGrade)
  );

  // 옵션/등기
  const [options, setOptions] = useState<string[]>(item.options ?? []);
  const [optionEtc, setOptionEtc] = useState(item.optionEtc ?? "");
  const toggleOption = (name: string) =>
    setOptions((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );

  const [registry, setRegistry] = useState<Registry>(item.registry ?? "주택");

  // 경사도/구조(등급)
  const [slopeGrade, setSlopeGrade] = useState<
    PropertyViewDetails["slopeGrade"]
  >(item.slopeGrade ?? "상");
  const [structureGrade, setStructureGrade] = useState<
    PropertyViewDetails["structureGrade"]
  >(item.structureGrade ?? "상");

  // 구조별 행
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

  // 메모 (단일 영역 전환)
  const [publicMemo, setPublicMemo] = useState(item.publicMemo ?? "");
  const [secretMemo, setSecretMemo] = useState(item.secretMemo ?? "");
  const memoValue = mode === "KN" ? publicMemo : secretMemo;
  const setMemoValue = (v: string) =>
    mode === "KN" ? setPublicMemo(v) : setSecretMemo(v);

  // item 값 변경되면 편집 상태 동기화
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

  function OrientationBadges({ data }: { data?: OrientationRow[] | null }) {
    if (!data?.length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {data.map((o) => (
          <span
            key={o.ho}
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
          >
            {o.ho}호: {o.value}
          </span>
        ))}
      </div>
    );
  }

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PropertyViewDetails | null>(
    null
  );

  // 모달 열릴 때는 보기모드로
  useEffect(() => {
    if (open) setIsEditing(false);
  }, [open]);

  // 저장/취소
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

        // 향(1/2/3호)
        aspect1,
        aspect2,
        aspect3,

        // 주차
        parkingType,
        parkingGrade: starsToGrade(parkingStars),

        completionDate,

        jeonsePrice,
        elevator,

        // 숫자 정보
        totalBuildings,
        totalFloors,
        totalHouseholds,
        remainingHouseholds,

        // 구조/옵션/등기/메모/이미지
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
    // 1) orientations가 있으면 그걸 그대로(ho 오름차순) 사용
    if (item.orientations && item.orientations.length > 0) {
      return [...item.orientations].sort((a, b) => a.ho - b.ho);
    }

    // 2) 없으면 레거시 aspect1~3으로 구성
    const fallback: { ho: number; value: string }[] = [];
    if (item.aspect1) fallback.push({ ho: 1, value: item.aspect1 });
    if (item.aspect2) fallback.push({ ho: 2, value: item.aspect2 });
    if (item.aspect3) fallback.push({ ho: 3, value: item.aspect3 });

    // 3) 그것마저 없으면 aspect/aspectNo 한 개만
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

            {/* 게시상태/거래상태 배지 */}
            <Badge variant="secondary">{displayStatus}</Badge>
            <Badge
              variant={displayDeal === "계약완료" ? "destructive" : "outline"}
            >
              {displayDeal}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* 공개/비밀 메모 토글 */}
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
          {/* 좌: 이미지 영역 */}
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

                  {/* 편집 모드에서만 업로드 버튼 */}
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

          {/* 우: View / Edit 컨텐츠 스왑 */}
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

              {/* 분양사무실 */}
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

              {/* 총 개동 / 총 층수 */}
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

              {/* 총 세대수 / 잔여세대 */}
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

              {/* 주차유형/평점(별) */}
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

              {/* 준공/최저실입 */}
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

              {/* 전용/실평/등기*/}
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

              {/* 경사도/구조 */}
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

              {/* 구조 요약 */}
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

              {/* 옵션 */}
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

              {/* 메모: 모드별 전환 */}
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

              {/* 메타 정보 */}
              <MetaBlock item={item} />
            </div>
          ) : (
            /* ===== Edit ===== */
            <div className="space-y-6">
              {/* 매물명 / 엘리베이터 */}
              <div className="grid grid-cols-2">
                <Field label="매물명">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="성수 리버뷰 84A"
                    className="h-9"
                  />
                </Field>
                <div className="justify-self-end w-full max-w-[260px]">
                  <Field label="엘리베이터">
                    <div className="flex gap-2">
                      {(["O", "X"] as const).map((v) => (
                        <Button
                          key={v}
                          size="sm"
                          type="button"
                          variant={elevator === v ? "default" : "outline"}
                          className="px-3"
                          onClick={() => setElevator(v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>

              <Field label="주소">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="서울 성동구 성수동1가 ..."
                  className="h-9"
                />
              </Field>

              {/* 분양사무실 연락처 */}
              <Field label="분양사무실">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={officePhone}
                      onChange={(e) => setOfficePhone(e.target.value)}
                      placeholder="대표번호"
                      className="pl-8 h-9"
                      inputMode="tel"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={officePhone2}
                      onChange={(e) => setOfficePhone2(e.target.value)}
                      placeholder="추가번호(선택)"
                      className="pl-8 h-9"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </Field>

              {/* 총 개동 / 총 층수 */}
              <div className="grid grid-cols-2 gap-6">
                <Field label="총 개동">
                  <Input
                    value={totalBuildings}
                    onChange={(e) => setTotalBuildings(e.target.value)}
                    placeholder="예: 2"
                    className="h-9"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="총 층수">
                  <Input
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                    placeholder="예: 10"
                    className="h-9"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              {/* 총 세대수 / 잔여세대 */}
              <div className="grid grid-cols-2 gap-6">
                <Field label="총 세대수">
                  <Input
                    value={totalHouseholds}
                    onChange={(e) => setTotalHouseholds(e.target.value)}
                    placeholder="예: 50"
                    className="h-9"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="잔여세대">
                  <Input
                    value={remainingHouseholds}
                    onChange={(e) => setRemainingHouseholds(e.target.value)}
                    placeholder="예: 10"
                    className="h-9"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <Field label="향">
                {orientationView.length > 0 ? (
                  <div className="flex flex-wrap gap-6">
                    {orientationView.map((o) => (
                      <div key={o.ho} className="flex gap-3">
                        <span className="h-9 flex items-center">{o.ho}호:</span>
                        <span className="h-9 flex items-center">{o.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-9 flex items-center">-</div>
                )}
              </Field>

              {/* 주차유형/평점(별) */}
              <div className="grid grid-cols-2 gap-6">
                <Field label="주차유형">
                  <Input
                    value={parkingType}
                    onChange={(e) => setParkingType(e.target.value)}
                    placeholder="예: 자주식 / 기계식 / 혼합 ..."
                    className="h-9"
                  />
                </Field>
                <Field label="주차평점">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const n = i + 1;
                      const filled = n <= parkingStars;
                      return (
                        <button
                          key={n}
                          type="button"
                          className="p-1"
                          onClick={() => setParkingStars(n)}
                          aria-label={`${n}점`}
                        >
                          <Star
                            className={
                              filled
                                ? "h-5 w-5 fill-current text-yellow-500 stroke-yellow-500"
                                : "h-5 w-5 text-gray-300 stroke-gray-300"
                            }
                          />
                        </button>
                      );
                    })}

                    {parkingStars > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => setParkingStars(0)}
                        title="초기화"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Field>
              </div>

              {/* 준공/최저실입*/}
              <div className="grid grid-cols-2 gap-6">
                <Field label="준공일">
                  <div className="w-full">
                    <Input
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      placeholder="예: 2024.04.14 또는 2024-04-14"
                      className="h-9"
                    />
                  </div>
                </Field>
                <Field label="최저실입">
                  <Input
                    value={jeonsePrice}
                    onChange={(e) => setJeonsePrice(e.target.value)}
                    placeholder="예: 5000만원"
                    className="h-9"
                  />
                </Field>
              </div>

              {/* 전용/실평/등기 (한 줄) - 보기와 동일 포맷으로 노출 */}
              <div className="grid grid-cols-3 gap-6">
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
              </div>

              {/* 경사도/구조(등급) */}
              <div className="grid grid-cols-2 gap-6">
                <Field label="경사도">
                  <div className="flex items-center gap-1">
                    {(["상", "중", "하"] as const).map((g) => (
                      <Button
                        key={g}
                        size="sm"
                        type="button"
                        variant={slopeGrade === g ? "default" : "outline"}
                        className="px-3"
                        onClick={() => setSlopeGrade(g)}
                      >
                        {g}
                      </Button>
                    ))}
                    {slopeGrade && (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => setSlopeGrade("상")}
                        title="상으로 초기화"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Field>

                <Field label="구조(등급)">
                  <div className="flex items-center gap-1">
                    {(["상", "중", "하"] as const).map((g) => (
                      <Button
                        key={g}
                        size="sm"
                        type="button"
                        variant={structureGrade === g ? "default" : "outline"}
                        className="px-3"
                        onClick={() => setStructureGrade(g)}
                      >
                        {g}
                      </Button>
                    ))}
                    {structureGrade && (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => setStructureGrade("상")}
                        title="상으로 초기화"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Field>
              </div>

              {/* 구조별 입력 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">구조별 입력</div>

                  <div className="flex flex-wrap gap-1">
                    {STRUCTURE_PRESETS.map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        type="button"
                        onClick={() => addLineFromPreset(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2 text-xs"
                      type="button"
                      onClick={addEmptyLine}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      직접추가
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {unitLines.length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      프리셋을 누르거나 ‘직접추가’를 눌러 행을 추가하세요.
                    </div>
                  )}

                  {unitLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[88px_auto_auto_minmax(180px,1fr)_32px] items-center gap-2"
                    >
                      <Input
                        value={`${line.rooms || ""}/${line.baths || ""}`}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\s/g, "");
                          const [r, b] = v.split("/");
                          updateLine(idx, {
                            rooms: parseInt(r || "0", 10) || 0,
                            baths: parseInt(b || "0", 10) || 0,
                          });
                        }}
                        placeholder="2/1"
                        className="h-9 text-center"
                      />

                      <label className="inline-flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={line.duplex}
                          onCheckedChange={(c) =>
                            updateLine(idx, { duplex: !!c })
                          }
                        />
                        <span>복층</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={line.terrace}
                          onCheckedChange={(c) =>
                            updateLine(idx, { terrace: !!c })
                          }
                        />
                        <span>테라스</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={line.primary}
                          onChange={(e) =>
                            updateLine(idx, { primary: e.target.value })
                          }
                          placeholder="직접입력"
                          className="h-9"
                        />
                        <Input
                          value={line.secondary}
                          onChange={(e) =>
                            updateLine(idx, { secondary: e.target.value })
                          }
                          placeholder="직접입력"
                          className="h-9"
                        />
                      </div>

                      {/* 행 삭제 */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("이 행을 삭제할까요?"))
                            removeLine(idx);
                        }}
                        title="삭제"
                        className="border-none shadow-transparent text-rose-600 hover:bg-rose-50 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 옵션 + 기타 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">옵션</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_OPTIONS.map((op) => (
                    <label
                      key={op}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={options.includes(op)}
                        onCheckedChange={() => toggleOption(op)}
                      />
                      <span>{op}</span>
                    </label>
                  ))}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm w-[52px]">기타</Label>
                    <Input
                      value={optionEtc}
                      onChange={(e) => setOptionEtc(e.target.value)}
                      placeholder="직접입력"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* 메모 (단일 영역 전환) */}
              <div
                className={cn(
                  "rounded-md border p-3",
                  mode === "KN" ? "bg-amber-50/60" : "bg-rose-50/70"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    mode === "R" && "text-rose-600"
                  )}
                >
                  {mode === "KN"
                    ? "특이사항(공개)"
                    : "리베이트 / 비밀 메모 (R)"}
                </div>

                <Textarea
                  value={memoValue}
                  onChange={(e) => setMemoValue(e.target.value)}
                  placeholder={mode === "KN" ? "공개 가능한 메모" : "내부 메모"}
                  rows={3}
                  className="resize-y"
                />
              </div>

              {/* 메타 정보 (수정 모드에서도 읽기 전용) */}
              <MetaBlock item={item} />
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
                    setEditTarget(item); // ← 현재 보는 매물로 타깃 설정
                    setEditOpen(true); // ← 수정 모달 열기
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
      {editOpen && (
        <PropertyEditModal
          open={editOpen}
          item={editTarget ?? item}
          onClose={() => setEditOpen(false)}
          onSubmit={async (patch) => {
            // patch 타입이 UpdatePayload라면, onSave가 Partial<PropertyViewDetails>를 받으므로 캐스팅
            await onSave?.(patch as Partial<PropertyViewDetails>);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* 공통 필드 래퍼 */
function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3 text-[13px]">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

/* 메타 정보 블록 */
function MetaBlock({ item }: { item: PropertyViewDetails }) {
  return (
    <div className="rounded-md border bg-white px-3 py-2">
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground">생성자</span>
          <span className="font-medium">{item.createdByName ?? "-"}</span>
          <span className="text-muted-foreground">{fmt(item.createdAt)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">답사자</span>
          <span className="font-medium">{item.inspectedByName ?? "-"}</span>
          <span className="text-muted-foreground">{fmt(item.inspectedAt)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">수정자</span>
          <span className="font-medium">{item.updatedByName ?? "-"}</span>
          <span className="text-muted-foreground">{fmt(item.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
