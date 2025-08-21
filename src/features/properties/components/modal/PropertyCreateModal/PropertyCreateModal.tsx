// features/properties/components/modal/PropertyCreateModal/PropertyCreateModal.tsx
"use client";

import { useMemo, useRef, useState, useEffect, Fragment } from "react";
import { X, Phone, Star, RefreshCw, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import { Textarea } from "@/components/atoms/Textarea/Textarea";

import { REGISTRY_LIST } from "@/features/properties/types/property-domain";
import type {
  DealStatus,
  Visibility,
  CreatePayload,
  Registry,
  UnitLine,
  OrientationRow,
} from "@/features/properties/types/property-domain";
import { buildOrientationFields } from "@/features/properties/lib/orientation";

export type PropertyCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: CreatePayload) => void | Promise<void>;
  /** 핀 클릭 시 역지오코딩으로 가져온 주소를 초기값으로 주입 */
  initialAddress?: string;
};

/* ===== 상수 ===== */

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
];

const ORIENTATIONS = [
  "동",
  "서",
  "남",
  "북",
  "남동",
  "남서",
  "북동",
  "북서",
  "동서",
  "남북",
];

export default function PropertyCreateModal({
  open,
  onClose,
  onSubmit,
  initialAddress,
}: PropertyCreateModalProps) {
  const STRUCTURE_PRESETS = ["1/1", "2/1", "3/1", "3/2", "4/2", "4/3"] as const;

  // 구조별 입력 행
  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);

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

  // 모드(K&N/R)
  const [mode, setMode] = useState<"KN" | "R">("KN");
  const toggleMode = () => setMode((m) => (m === "KN" ? "R" : "KN"));

  // 좌측 이미지 업로드 4칸
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

  // 우측 입력값들
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");

  // 모달이 열릴 때마다 initialAddress를 주소 입력란에 주입
  useEffect(() => {
    if (!open) return;
    setAddress(initialAddress ?? "");
  }, [open, initialAddress]);

  const [officeName, setOfficeName] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");

  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  // 동적 향 목록 (1호부터 시작)
  type AspectRow = { no: number; dir: string };
  const [aspects, setAspects] = useState<AspectRow[]>([{ no: 1, dir: "" }]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects(
      (prev) =>
        prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 })) // 번호 재정렬
    );
  const setAspectDir = (no: number, dir: string) =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  const [parkingType, setParkingType] = useState(""); // 주차유형
  const [completionDate, setCompletionDate] = useState(""); // 준공일
  const [jeonsePrice, setJeonsePrice] = useState(""); // 최저실입

  // 전용/실평 범위 입력 (m² & 평)
  const [exMinM2, setExMinM2] = useState("");
  const [exMaxM2, setExMaxM2] = useState("");
  const [exMinPy, setExMinPy] = useState("");
  const [exMaxPy, setExMaxPy] = useState("");

  const [realMinM2, setRealMinM2] = useState("");
  const [realMaxM2, setRealMaxM2] = useState("");
  const [realMinPy, setRealMinPy] = useState("");
  const [realMaxPy, setRealMaxPy] = useState("");

  // 단위 변환(1평 = 3.3058m²)
  const PYEONG = 3.3058;
  const toPy = (m2: string) => {
    const n = parseFloat(m2);
    return Number.isFinite(n) ? (n / PYEONG).toFixed(2) : "";
  };
  const toM2 = (py: string) => {
    const n = parseFloat(py);
    return Number.isFinite(n) ? (n * PYEONG).toFixed(2) : "";
  };

  // 주차: 별점
  const [parkingStars, setParkingStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const starToGrade = (n: number): "상" | "중" | "하" | undefined => {
    if (n >= 4) return "상";
    if (n >= 2) return "중";
    if (n > 0) return "하";
    return undefined;
  };

  // 엘리베이터 O/X
  const [elevator, setElevator] = useState<"O" | "X">("O");

  const [totalBuildingsType, setTotalBuildingsType] = useState<
    "select" | "custom"
  >("select");
  const [totalBuildings, setTotalBuildings] = useState("");

  const [totalFloorsType, setTotalFloorsType] = useState<"select" | "custom">(
    "select"
  );
  const [totalFloors, setTotalFloors] = useState("");

  const [totalHouseholdsType, setTotalHouseholdsType] = useState<
    "select" | "custom"
  >("select");
  const [totalHouseholds, setTotalHouseholds] = useState("");

  const [remainingHouseholdsType, setRemainingHouseholdsType] = useState<
    "select" | "custom"
  >("select");
  const [remainingHouseholds, setRemainingHouseholds] = useState("");

  const [etcChecked, setEtcChecked] = useState(false);

  // 숫자 옵션 공통
  const numberItems = useMemo(
    () => Array.from({ length: 20 }, (_, i) => `${i + 1}`),
    []
  );

  // 옵션/기타
  const [options, setOptions] = useState<string[]>([]);
  const [optionEtc, setOptionEtc] = useState("");
  const toggleOption = (name: string) =>
    setOptions((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );

  // 메모 (토글에 따라 한 자리에서 전환)
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");
  const memoValue = mode === "KN" ? publicMemo : secretMemo;
  const setMemoValue = (v: string) => {
    if (mode === "KN") setPublicMemo(v);
    else setSecretMemo(v);
  };

  const [registryOne, setRegistryOne] = useState<Registry | undefined>(
    undefined
  );

  const [slopeGrade, setSlopeGrade] = useState<
    "상" | "중" | "하" | undefined
  >();
  const [structureGrade, setStructureGrade] = useState<
    "상" | "중" | "하" | undefined
  >();

  // 헤더 상태 옵션
  const STATUS_OPTIONS = ["공개", "보류", "비공개"] as const;

  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

  // 옵션 유효성: 일반 옵션이 하나 이상이거나, '기타'가 체크되어 있고 값이 있을 때 OK
  const optionsValid = useMemo(() => {
    const hasNormal = options.length > 0;
    const hasEtc = etcChecked && optionEtc.trim().length > 0;
    return hasNormal || hasEtc;
  }, [options, etcChecked, optionEtc]);

  // --- 필수값 유효성 체크 ---
  const filled = (s: string) => s.trim().length > 0;
  const hasNumber = (type: "select" | "custom", v: string) => filled(v);

  // 둘 다 값이 채워졌는지 확인
  const hasPair = (min: string, max: string) =>
    min.trim().length > 0 && max.trim().length > 0;

  // 전용: (m² 한 쌍) or (평 한 쌍) 중 하나만 만족하면 통과
  const hasExclusiveAny = useMemo(
    () => hasPair(exMinM2, exMaxM2) || hasPair(exMinPy, exMaxPy),
    [exMinM2, exMaxM2, exMinPy, exMaxPy]
  );

  // 실평: (m² 한 쌍) or (평 한 쌍) 중 하나만 만족하면 통과
  const hasRealAny = useMemo(
    () => hasPair(realMinM2, realMaxM2) || hasPair(realMinPy, realMaxPy),
    [realMinM2, realMaxM2, realMinPy, realMaxPy]
  );

  // 향 유효성: 최소 1호의 방향 선택
  const aspectsValid = aspects.length > 0 && aspects[0].dir.trim().length > 0;

  const canSave = useMemo(() => {
    const aspectsValid = aspects.length > 0 && aspects[0].dir.trim().length > 0;

    const basic =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(parkingType) &&
      filled(completionDate) &&
      filled(jeonsePrice) &&
      hasExclusiveAny && // 전용: 쌍(최소+최대), m²/평 중 하나 기준
      hasRealAny && // 실평: 쌍(최소+최대), m²/평 중 하나 기준
      !!slopeGrade &&
      !!structureGrade;

    const numbers =
      hasNumber(totalBuildingsType, totalBuildings) &&
      hasNumber(totalFloorsType, totalFloors) &&
      hasNumber(totalHouseholdsType, totalHouseholds) &&
      hasNumber(remainingHouseholdsType, remainingHouseholds);

    const hasUnitLines = unitLines.length > 0;
    const parkingOk = parkingStars > 0;

    return (
      basic &&
      numbers &&
      optionsValid &&
      hasUnitLines &&
      parkingOk &&
      aspectsValid
    );
  }, [
    title,
    address,
    officePhone,
    parkingType,
    completionDate,
    jeonsePrice,
    hasExclusiveAny,
    hasRealAny,
    slopeGrade,
    structureGrade,
    totalBuildingsType,
    totalBuildings,
    totalFloorsType,
    totalFloors,
    totalHouseholdsType,
    totalHouseholds,
    remainingHouseholdsType,
    remainingHouseholds,
    optionsValid,
    unitLines,
    parkingStars,
    aspects,
  ]);

  const save = async () => {
    if (!title.trim()) return;

    // 1) 호수 기반으로 orientation 필드 일괄 생성
    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      buildOrientationFields(aspects);

    // 평만 입력한 경우를 대비해 m² 최종값 보정
    const exMinM2Final = exMinM2.trim() || toM2(exMinPy);
    const exMaxM2Final = exMaxM2.trim() || toM2(exMaxPy);
    const realMinM2Final = realMinM2.trim() || toM2(realMinPy);
    const realMaxM2Final = realMaxM2.trim() || toM2(realMaxPy);

    // 범위 문자열 포맷
    const pack = (a: string, b: string) => {
      const A = a.trim(),
        B = b.trim();
      if (A && B) return `${A}~${B}`;
      if (A) return `${A}~`;
      if (B) return `~${B}`;
      return "";
    };

    const payload: CreatePayload = {
      status: visibility,
      dealStatus,

      title,
      address,
      officeName,
      officePhone,
      officePhone2,
      moveIn,
      floor,
      roomNo,
      structure,

      // 향
      aspect,
      aspectNo,
      ...(aspect1 ? { aspect1 } : {}),
      ...(aspect2 ? { aspect2 } : {}),
      ...(aspect3 ? { aspect3 } : {}),
      orientations,

      jeonsePrice,
      parkingGrade: starToGrade(parkingStars),
      parkingType,
      completionDate,

      // 전용/실평은 m² 기준(보정값)으로 저장
      exclusiveArea: pack(exMinM2Final, exMaxM2Final),
      realArea: pack(realMinM2Final, realMaxM2Final),
      elevator,

      totalBuildings:
        totalBuildingsType === "select"
          ? totalBuildings
          : `${totalBuildings}(직접입력)`,
      totalFloors:
        totalFloorsType === "select" ? totalFloors : `${totalFloors}(직접입력)`,
      totalHouseholds:
        totalHouseholdsType === "select"
          ? totalHouseholds
          : `${totalHouseholds}(직접입력)`,
      remainingHouseholds:
        remainingHouseholdsType === "select"
          ? remainingHouseholds
          : `${remainingHouseholds}(직접입력)`,

      slopeGrade,
      structureGrade,

      options,
      optionEtc: etcChecked ? optionEtc.trim() : "",
      publicMemo,
      secretMemo: mode === "R" ? secretMemo : undefined,
      registry: registryOne,
      unitLines,
      images,
    };

    await onSubmit?.(payload);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    // 새로 열릴 때 1호만 빈 값으로
    setAspects([{ no: 1, dir: "" }]);
  }, [open]);

  // 렌더
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* dim */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div
        className="
          absolute left-1/2 top-1/2 w-[980px] max-w-[95vw] max-h-[92vh]
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col
        "
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title || "새 매물"}</h2>

            {/* 상태 선택 */}
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as Visibility)}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue placeholder="게시상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="공개">공개</SelectItem>
                <SelectItem value="보류">보류</SelectItem>
                <SelectItem value="비공개">비공개</SelectItem>
              </SelectContent>
            </Select>

            {/* 거래상태 셀렉트 */}
            <Select
              value={dealStatus}
              onValueChange={(v) => setDealStatus(v as DealStatus)}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue placeholder="거래상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="분양중">분양중</SelectItem>
                <SelectItem value="예약중">예약중</SelectItem>
                <SelectItem value="계약중">계약중</SelectItem>
                <SelectItem value="계약완료">계약완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* 단일 토글 버튼 */}
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

        {/* 바디(스크롤 영역) */}
        <div
          className="
            grid grid-cols-[300px_1fr] gap-6 px-5 py-4
            flex-1 min-h-0 overflow-y-auto overscroll-y-contain
          "
        >
          {/* 좌: 이미지 업로드(4칸) */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => {
              const isContract = i === 3; // 4번째 = 파일
              return (
                <div
                  key={i}
                  className={[
                    "relative rounded-lg overflow-hidden border bg-muted/30",
                    isContract ? "h-[360px]" : "h-[160px]",
                  ].join(" ")}
                >
                  <div className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                    {isContract ? "파일" : `사진 ${i + 1}`}
                  </div>

                  {images[i] ? (
                    <img
                      src={images[i]}
                      alt={isContract ? "contract" : `photo-${i}`}
                      className={[
                        "block w-full h-full",
                        isContract ? "object-contain bg-white" : "object-cover",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {isContract ? "파일 업로드" : "파일 업로드"}
                    </div>
                  )}

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
                </div>
              );
            })}
          </div>

          {/* 우: 상세 입력들 */}
          <div className="space-y-6">
            {/* 매물명/엘리베이터 */}
            <div className="grid grid-cols-2">
              <Field label="매물명">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 성수 리버뷰 84A"
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
                placeholder="예: 서울 성동구 성수동1가 ..."
                className="h-9"
              />
            </Field>

            {/* 분양사무실/연락처 */}
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

            {/* 개동/층수 */}
            <div className="grid grid-cols-2">
              {/* 총 개동 */}
              <Field label="총 개동">
                <div className="flex gap-2 items-center">
                  <Select
                    value={
                      totalBuildingsType === "select"
                        ? totalBuildings
                        : "custom"
                    }
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setTotalBuildingsType("custom");
                        setTotalBuildings("");
                      } else {
                        setTotalBuildingsType("select");
                        setTotalBuildings(val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {numberItems.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">직접입력</SelectItem>
                    </SelectContent>
                  </Select>

                  {totalBuildingsType === "custom" && (
                    <Input
                      value={totalBuildings}
                      onChange={(e) => setTotalBuildings(e.target.value)}
                      placeholder="예: 2"
                      className="w-20 h-9 text-center"
                      inputMode="numeric"
                    />
                  )}
                </div>
              </Field>

              {/* 총 층수 */}
              <Field label="총 층수">
                <div className="flex gap-2 items-center">
                  <Select
                    value={
                      totalFloorsType === "select" ? totalFloors : "custom"
                    }
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setTotalFloorsType("custom");
                        setTotalFloors("");
                      } else {
                        setTotalFloorsType("select");
                        setTotalFloors(val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {numberItems.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">직접입력</SelectItem>
                    </SelectContent>
                  </Select>

                  {totalFloorsType === "custom" && (
                    <Input
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(e.target.value)}
                      placeholder="예: 10"
                      className="w-20 h-9 text-center"
                      inputMode="numeric"
                    />
                  )}
                </div>
              </Field>
            </div>

            {/* 세대/잔여 */}
            <div className="grid grid-cols-2">
              {/* 총 세대수 */}
              <Field label="총 세대수">
                <div className="flex gap-2 items-center">
                  <Select
                    value={
                      totalHouseholdsType === "select"
                        ? totalHouseholds
                        : "custom"
                    }
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setTotalHouseholdsType("custom");
                        setTotalHouseholds("");
                      } else {
                        setTotalHouseholdsType("select");
                        setTotalHouseholds(val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {numberItems.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">직접입력</SelectItem>
                    </SelectContent>
                  </Select>

                  {totalHouseholdsType === "custom" && (
                    <Input
                      value={totalHouseholds}
                      onChange={(e) => setTotalHouseholds(e.target.value)}
                      placeholder="예: 50"
                      className="w-20 h-9 text-center"
                      inputMode="numeric"
                    />
                  )}
                </div>
              </Field>

              {/* 잔여세대 */}
              <Field label="잔여세대">
                <div className="flex gap-2 items-center">
                  <Select
                    value={
                      remainingHouseholdsType === "select"
                        ? remainingHouseholds
                        : "custom"
                    }
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setRemainingHouseholdsType("custom");
                        setRemainingHouseholds("");
                      } else {
                        setRemainingHouseholdsType("select");
                        setRemainingHouseholds(val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {numberItems.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">직접입력</SelectItem>
                    </SelectContent>
                  </Select>

                  {remainingHouseholdsType === "custom" && (
                    <Input
                      value={remainingHouseholds}
                      onChange={(e) => setRemainingHouseholds(e.target.value)}
                      placeholder="예: 10"
                      className="w-20 h-9 text-center"
                      inputMode="numeric"
                    />
                  )}
                </div>
              </Field>
            </div>

            {/* 향/방향 */}
            <Field label="향">
              {(() => {
                // 두 개씩 끊어서 한 줄에 배치
                const rows: { no: number; dir: string }[][] = [];
                for (let i = 0; i < aspects.length; i += 2) {
                  rows.push(aspects.slice(i, i + 2));
                }

                const Cell = ({
                  row,
                }: {
                  row: { no: number; dir: string };
                }) => (
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-right">{row.no}호</span>
                    <Select
                      value={row.dir}
                      onValueChange={(v) => setAspectDir(row.no, v)}
                    >
                      <SelectTrigger className="w-[110px] h-9">
                        <SelectValue placeholder="방향" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIENTATIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {aspects.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        onClick={() => removeAspect(row.no)}
                        title="삭제"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );

                return (
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-x-3 gap-y-2">
                    {rows.map((pair, rowIdx) => {
                      const isLastRow = rowIdx === rows.length - 1;
                      return (
                        <Fragment key={`aspect-row-${rowIdx}`}>
                          <div>
                            {pair[0] ? (
                              <Cell row={pair[0]} />
                            ) : (
                              <div className="h-9" />
                            )}
                          </div>
                          <div>
                            {pair[1] ? (
                              <Cell row={pair[1]} />
                            ) : (
                              <div className="h-9" />
                            )}
                          </div>
                          <div className="flex items-center justify-end">
                            {isLastRow && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={addAspect}
                                title="추가"
                                className="h-8 w-8 p-0 bg-transparent hover:bg-transparent focus-visible:ring-0 border-none shadow-none"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Fragment>
                      );
                    })}
                  </div>
                );
              })()}
            </Field>

            {/* 주차유형/주차평점 */}
            <div className="grid grid-cols-2 gap-6">
              <Field label="주차유형">
                <Input
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value)}
                  placeholder="ex) 답사지 확인"
                  className="h-9"
                />
              </Field>

              <Field label="주차평점">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hoverStars || parkingStars) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`별 ${n}개`}
                        className="p-1 leading-none"
                        onClick={() => setParkingStars(n)}
                        onMouseEnter={() => setHoverStars(n)}
                        onMouseLeave={() => setHoverStars(0)}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5 transition-colors",
                            active
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          )}
                        />
                      </button>
                    );
                  })}
                  {parkingStars > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
                      onClick={() => setParkingStars(0)}
                      title="초기화"
                      className="ml-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Field>
            </div>

            {/* 준공/최저실입 */}
            <div className="grid grid-cols-2 gap-6">
              <Field label="준공일">
                <Input
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  placeholder="ex) 2024.04.14"
                  className="h-9"
                />
              </Field>
              <Field label="최저실입">
                <Input
                  value={jeonsePrice}
                  onChange={(e) => setJeonsePrice(e.target.value)}
                  placeholder="ex) 5000만원"
                  className="h-9"
                />
              </Field>
            </div>
            {/* 전용 (범위) */}
            <Field label="전용">
              <div className="flex gap-2">
                {/* m² */}
                <div className="flex items-center gap-2">
                  <Input
                    value={exMinM2}
                    onChange={(e) => setExMinM2(e.target.value)}
                    onBlur={(e) => setExMinPy(toPy(e.target.value))}
                    placeholder="최소"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>m²</span>
                  <span>~</span>
                  <Input
                    value={exMaxM2}
                    onChange={(e) => setExMaxM2(e.target.value)}
                    onBlur={(e) => setExMaxPy(toPy(e.target.value))}
                    placeholder="최대"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>m²</span>
                </div>
                {/* 평 */}
                <div className="flex items-center gap-2">
                  <Input
                    value={exMinPy}
                    onChange={(e) => setExMinPy(e.target.value)}
                    onBlur={(e) => setExMinM2(toM2(e.target.value))}
                    placeholder="최소"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>평</span>
                  <span>~</span>
                  <Input
                    value={exMaxPy}
                    onChange={(e) => setExMaxPy(e.target.value)}
                    onBlur={(e) => setExMaxM2(toM2(e.target.value))}
                    placeholder="최대"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>평</span>
                </div>
              </div>
            </Field>

            {/* 실평 (범위) */}
            <Field label="실평">
              <div className="flex gap-2">
                {/* m² */}
                <div className="flex items-center gap-2">
                  <Input
                    value={realMinM2}
                    onChange={(e) => setRealMinM2(e.target.value)}
                    onBlur={(e) => setRealMinPy(toPy(e.target.value))}
                    placeholder="최소"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>m²</span>
                  <span>~</span>
                  <Input
                    value={realMaxM2}
                    onChange={(e) => setRealMaxM2(e.target.value)}
                    onBlur={(e) => setRealMaxPy(toPy(e.target.value))}
                    placeholder="최대"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>m²</span>
                </div>
                {/* 평 */}
                <div className="flex items-center gap-2">
                  <Input
                    value={realMinPy}
                    onChange={(e) => setRealMinPy(e.target.value)}
                    onBlur={(e) => setRealMinM2(toM2(e.target.value))}
                    placeholder="최소"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>평</span>
                  <span>~</span>
                  <Input
                    value={realMaxPy}
                    onChange={(e) => setRealMaxPy(e.target.value)}
                    onBlur={(e) => setRealMaxM2(toM2(e.target.value))}
                    placeholder="최대"
                    className="h-9 w-20 text-right"
                    inputMode="decimal"
                  />
                  <span>평</span>
                </div>
              </div>
            </Field>

            {/* 등기 (한 줄 라디오) */}
            <Field label="등기">
              <div className="flex flex-wrap gap-3">
                {REGISTRY_LIST.map((r) => (
                  <label
                    key={r}
                    className="inline-flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="registry"
                      value={r}
                      checked={registryOne === (r as Registry)}
                      onChange={(e) =>
                        setRegistryOne(e.target.value as Registry)
                      }
                      className="sr-only peer"
                    />
                    <span
                      className="
                        inline-grid h-4 w-4 place-items-center rounded-full border border-blue-500
                        peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 peer-focus-visible:ring-offset-2
                        before:content-[''] before:block before:h-2 before:w-2 before:rounded-full before:bg-blue-600
                        before:scale-0 before:transition-transform peer-checked:before:scale-100
                      "
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
            </Field>

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
                      onClick={() => setSlopeGrade(undefined)}
                      title="초기화"
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
                      onClick={() => setStructureGrade(undefined)}
                      title="초기화"
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

                {/* 프리셋 버튼들 */}
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

              {/* 행 리스트 */}
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
                    {/* 방/욕실 입력(예: 2/1) */}
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

                    {/* 복층 체크 */}
                    <label className="inline-flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={line.duplex}
                        onCheckedChange={(c) =>
                          updateLine(idx, { duplex: !!c })
                        }
                      />
                      <span>복층</span>
                    </label>

                    {/* 테라스 체크 */}
                    <label className="inline-flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={line.terrace}
                        onCheckedChange={(c) =>
                          updateLine(idx, { terrace: !!c })
                        }
                      />
                      <span>테라스</span>
                    </label>

                    {/* 숫자 2개 */}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={line.primary}
                        onChange={(e) =>
                          updateLine(idx, { primary: e.target.value })
                        }
                        placeholder="직접입력"
                        className="h-9"
                        inputMode="numeric"
                      />
                      <Input
                        value={line.secondary}
                        onChange={(e) =>
                          updateLine(idx, { secondary: e.target.value })
                        }
                        placeholder="직접입력"
                        className="h-9"
                        inputMode="numeric"
                      />
                    </div>

                    {/* 삭제 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removeLine(idx)}
                      title="행 삭제"
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

              {/* 3열 그리드 유지: sm=2, md=3 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-center">
                {ALL_OPTIONS.map((op) => (
                  <label
                    key={op}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={options.includes(op)}
                      onCheckedChange={() =>
                        setOptions((prev) =>
                          prev.includes(op)
                            ? prev.filter((x) => x !== op)
                            : [...prev, op]
                        )
                      }
                    />
                    <span className="text-sm">{op}</span>
                  </label>
                ))}

                {/* 기타 */}
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <label className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                    <Checkbox
                      checked={etcChecked}
                      onCheckedChange={(c) => {
                        const next = !!c;
                        setEtcChecked(next);
                        if (!next) setOptionEtc("");
                      }}
                    />
                    <span className="text-sm leading-none">기타</span>
                  </label>

                  <Input
                    value={optionEtc}
                    onChange={(e) => setOptionEtc(e.target.value)}
                    placeholder="직접입력"
                    className="h-9 w-[120px] shrink-0"
                    disabled={!etcChecked}
                  />
                </div>
              </div>
            </div>

            {/* 메모 (단일 영역, 토글 전환) */}
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
                {mode === "KN" ? "특이사항(공개)" : "리베이트 / 비밀 메모 (R)"}
              </div>

              <Textarea
                value={memoValue}
                onChange={(e) => setMemoValue(e.target.value)}
                placeholder={mode === "KN" ? "공개 가능한 메모" : "내부 메모"}
                rows={3}
                className="resize-y"
              />
            </div>

            {/* 하단 버튼 */}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={save} disabled={!canSave}>
                저장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 작은 유틸 ---------- */

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-start gap-3 text-[13px]">
      <div className="text-muted-foreground leading-9 pt-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
