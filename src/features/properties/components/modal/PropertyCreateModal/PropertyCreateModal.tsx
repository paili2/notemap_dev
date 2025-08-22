"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Phone, RefreshCw } from "lucide-react";
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
  Registry,
  UnitLine,
  Grade,
  OrientationValue,
} from "@/features/properties/types/property-domain";
import { buildOrientationFields } from "@/features/properties/lib/orientation";

import Field from "../../common/Field";
import ImagesGrid from "../../common/ImagesGrid";

import { PropertyCreateModalProps } from "./types";
import AspectsEditor from "../../common/AspectsEditor";
import StarsRating from "../../common/StarsRating";
import StructureLines from "../../common/StructureLines";
import { AspectRowLite } from "../../common/types";
import { ALL_OPTIONS, STRUCTURE_PRESETS } from "../../common/constants";
import { packRange, parsePreset, toM2, toPy } from "../../../lib/area";
import { starsToGrade } from "../../../lib/grade";
import { CreatePayload } from "@/features/properties/types/property-dto";

export default function PropertyCreateModal({
  open,
  onClose,
  onSubmit,
  initialAddress,
}: PropertyCreateModalProps) {
  if (!open) return null;

  // === 이미지 업로드 ===
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

  // === 기본 상태 ===
  const [mode, setMode] = useState<"KN" | "R">("KN");
  const toggleMode = () => setMode((m) => (m === "KN" ? "R" : "KN"));

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  useEffect(() => {
    if (open) setAddress(initialAddress ?? "");
  }, [open, initialAddress]);

  const [officeName, setOfficeName] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  // === 향 ===
  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);
  useEffect(() => {
    if (open) setAspects([{ no: 1, dir: "" }]);
  }, [open]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );

  const setAspectDir = (no: number, dir: OrientationValue | "") =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  // === 주차/준공/실입 ===
  const [parkingType, setParkingType] = useState("");
  const [parkingStars, setParkingStars] = useState(0);
  const [completionDate, setCompletionDate] = useState("");
  const [jeonsePrice, setJeonsePrice] = useState("");

  // === 면적 ===
  const [exMinM2, setExMinM2] = useState("");
  const [exMaxM2, setExMaxM2] = useState("");
  const [exMinPy, setExMinPy] = useState("");
  const [exMaxPy, setExMaxPy] = useState("");
  const [realMinM2, setRealMinM2] = useState("");
  const [realMaxM2, setRealMaxM2] = useState("");
  const [realMinPy, setRealMinPy] = useState("");
  const [realMaxPy, setRealMaxPy] = useState("");

  // === 엘리베이터/등기/등급 ===
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>(
    undefined
  );
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  // === 숫자 선택 ===
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

  const numberItems = useMemo(
    () => Array.from({ length: 20 }, (_, i) => `${i + 1}`),
    []
  );

  // === 옵션 ===
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");

  // === 메모 ===
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");
  const memoValue = mode === "KN" ? publicMemo : secretMemo;
  const setMemoValue = (v: string) =>
    mode === "KN" ? setPublicMemo(v) : setSecretMemo(v);

  // === 헤더 상태 ===
  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

  // === 구조별 입력 ===
  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);
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
  const addEmptyLine = () =>
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

  const updateLine = (idx: number, patch: Partial<UnitLine>) =>
    setUnitLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  const removeLine = (idx: number) =>
    setUnitLines((prev) => prev.filter((_, i) => i !== idx));

  // === 유효성 ===
  const filled = (s: string) => s.trim().length > 0;
  const hasPair = (min: string, max: string) => min.trim() && max.trim();
  const hasExclusiveAny = useMemo(
    () => hasPair(exMinM2, exMaxM2) || hasPair(exMinPy, exMaxPy),
    [exMinM2, exMaxM2, exMinPy, exMaxPy]
  );
  const hasRealAny = useMemo(
    () => hasPair(realMinM2, realMaxM2) || hasPair(realMinPy, realMaxPy),
    [realMinM2, realMaxM2, realMinPy, realMaxPy]
  );
  const optionsValid = useMemo(
    () => options.length > 0 || (etcChecked && optionEtc.trim().length > 0),
    [options, etcChecked, optionEtc]
  );

  const canSave = useMemo(() => {
    const aspectsValid = aspects.length > 0 && aspects[0].dir.trim().length > 0;
    const numbers =
      filled(totalBuildings) &&
      filled(totalFloors) &&
      filled(totalHouseholds) &&
      filled(remainingHouseholds);

    const basic =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(parkingType) &&
      filled(completionDate) &&
      filled(jeonsePrice) &&
      hasExclusiveAny &&
      hasRealAny &&
      !!slopeGrade &&
      !!structureGrade;

    return (
      basic &&
      numbers &&
      optionsValid &&
      unitLines.length > 0 &&
      parkingStars > 0 &&
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
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,
    optionsValid,
    unitLines,
    parkingStars,
    aspects,
  ]);

  // === 저장 ===
  const save = async () => {
    if (!title.trim()) return;

    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      buildOrientationFields(aspects);

    const exMinM2Final = exMinM2.trim() || toM2(exMinPy);
    const exMaxM2Final = exMaxM2.trim() || toM2(exMaxPy);
    const realMinM2Final = realMinM2.trim() || toM2(realMinPy);
    const realMaxM2Final = realMaxM2.trim() || toM2(realMaxPy);

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
      aspect,
      aspectNo,
      ...(aspect1 ? { aspect1 } : {}),
      ...(aspect2 ? { aspect2 } : {}),
      ...(aspect3 ? { aspect3 } : {}),
      orientations,
      jeonsePrice,
      parkingGrade: starsToGrade(parkingStars),
      parkingType,
      completionDate,
      exclusiveArea: packRange(exMinM2Final, exMaxM2Final),
      realArea: packRange(realMinM2Final, realMaxM2Final),
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

  // === 렌더 ===
  return (
    <div className="fixed inset-0 z-[100]">
      {/* dim */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div className="absolute left-1/2 top-1/2 w-[980px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title || "새 매물"}</h2>

            {/* 게시상태 */}
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

            {/* 거래상태 */}
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
          <ImagesGrid
            images={images}
            onPickImage={pickImage}
            fileInputs={fileInputs}
            onPickFile={onPickFile}
          />

          {/* 우: 상세 */}
          <div className="space-y-6">
            {/* 매물명/엘베 */}
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
            {/* 향 */}
            <Field label="향">
              <AspectsEditor
                aspects={aspects}
                addAspect={addAspect}
                removeAspect={removeAspect}
                setAspectDir={setAspectDir}
              />
            </Field>
            {/* 주차/별점 */}
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
                <StarsRating value={parkingStars} onChange={setParkingStars} />
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
                  <span>m²</span> <span>~</span>
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
                  <span>평</span> <span>~</span>
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
                  <span>m²</span> <span>~</span>
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
                  <span>평</span> <span>~</span>
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
            {/* 등기 */}
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
                    <span className="inline-grid h-4 w-4 place-items-center rounded-full border border-blue-500 before:content-[''] before:block before:h-2 before:w-2 before:rounded-full before:bg-blue-600 before:scale-0 before:transition-transform peer-checked:before:scale-100" />
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
            <StructureLines
              lines={unitLines}
              onAddPreset={addLineFromPreset}
              onAddEmpty={addEmptyLine}
              onUpdate={updateLine}
              onRemove={removeLine}
              presets={STRUCTURE_PRESETS}
            />
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
            {/* 메모 */}
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
                rows={3}
                className="resize-y"
                placeholder={mode === "KN" ? "공개 가능한 메모" : "내부 메모"}
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
