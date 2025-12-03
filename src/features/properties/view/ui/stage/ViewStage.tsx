"use client";

import { useCallback, useEffect, useMemo } from "react";
import type React from "react";

import type { PropertyViewDetails } from "../../types";
import { useViewForm } from "../../hooks/useViewForm";

import HeaderViewContainer from "../containers/HeaderViewContainer";
import DisplayImagesContainer from "../containers/DisplayImagesContainer";
import BasicInfoViewContainer from "../containers/BasicInfoViewContainer";
import NumbersViewContainer from "../containers/NumbersViewContainer";
import ParkingViewContainer from "../containers/ParkingViewContainer";
import CompletionRegistryViewContainer from "../containers/CompletionRegistryViewContainer";
import StructureLinesListContainer from "../containers/StructureLinesListContainer";
import OptionsBadgesContainer from "../containers/OptionsBadgesContainer";
import MemosContainer from "../containers/MemosContainer";

import MetaInfoContainer from "../../sections/MetaInfoContainer";

import { cn } from "@/lib/cn";
import { useMemoViewMode } from "@/features/properties/store/useMemoViewMode";
import { useIsMobileBreakpoint } from "@/hooks/useIsMobileBreakpoint";
import { ALLOW_MOBILE_PROPERTY_EDIT } from "@/features/properties/constants";
import { useToast } from "@/hooks/use-toast";
import { deriveAgeTypeFrom } from "../../utils/ageType";
import ViewLoadingSkeleton from "../parts/ViewLoadingSkeleton";
import ViewActionsBar from "../parts/ViewActionsBar";
import AreaSetsViewContainer from "../containers/AreaSetsViewContainer";
import AspectsViewContainer from "../containers/AspectsViewContainer";
import { useMe } from "@/shared/api/auth/auth";

/* 지도 이벤트만 막고 기본 클릭은 그대로 두기 */
function eat(e: any) {
  try {
    (window as any)?.kakao?.maps?.event?.preventMap?.();
  } catch {}
}

type Props = {
  data: PropertyViewDetails | null;
  metaDetails: any;
  headingId: string;
  descId: string;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
  loading?: boolean;
  onRequestEdit: (seed: any) => void;
  asInner?: boolean;
  /** ✅ 쿼리 결과/부모 prop 기반 최초 initialForEdit(raw+view) */
  initialForEdit: any | null;
  /** ✅ 마지막으로 저장한 payload (있으면 이걸 우선 사용) */
  lastEditPayload: any | null;
};

export default function ViewStage({
  data,
  metaDetails,
  headingId,
  descId,
  onClose,
  onDelete,
  deleting,
  loading,
  onRequestEdit,
  asInner,
  initialForEdit,
  lastEditPayload, // 아직 안 쓰고 있지만 시그니처만 유지
}: Props) {
  // ✅ 현재 로그인 유저 정보
  const { data: me } = useMe();
  const { toast } = useToast();

  // ✅ 모바일 여부 & 모바일 수정 가능 여부
  const isMobile = useIsMobileBreakpoint(768);
  const canEditOnMobile = ALLOW_MOBILE_PROPERTY_EDIT;
  const canEditProperty = !isMobile || canEditOnMobile;
  const showEditButton = !isMobile || canEditOnMobile;

  // ✅ 삭제 버튼 노출 권한: 부장 / 팀장만
  const role = me?.role;
  const canDelete = ["admin", "manager"].includes(role ?? "");

  const hasData = !!data;
  const formInput = useMemo(
    () => ({ open: true, data: data ?? ({} as PropertyViewDetails) }),
    [data]
  );
  const f = useViewForm(formInput);

  // ✅ ageType은 뷰데이터 + 폼 상태 합쳐서 계산
  const ageType = useMemo<"NEW" | "OLD" | null>(() => {
    const src = { ...(data as any), ...(f as any) };
    const resolved = deriveAgeTypeFrom(src);
    return resolved;
  }, [data, f]);

  const rebateTextFromSources = useMemo(() => {
    const fromView = (data as any)?.rebateText;
    const fromForm = (f as any)?.rebateText;
    const fromMetaRoot = (metaDetails as any)?.rebateText;
    const fromRaw = (metaDetails as any)?.raw?.rebateText;

    return fromView ?? fromForm ?? fromMetaRoot ?? fromRaw ?? null;
  }, [data, f, metaDetails]);

  /** ✅ parkingType도 여러 소스에서 안전하게 합쳐서 사용 */
  const parkingTypeResolved = useMemo(() => {
    const fromForm = (f as any)?.parkingType;
    const fromView = (data as any)?.parkingType;
    const fromMetaRoot = (metaDetails as any)?.parkingType;
    const fromRaw = (metaDetails as any)?.raw?.parkingType;

    return fromForm ?? fromView ?? fromMetaRoot ?? fromRaw ?? null;
  }, [f, data, metaDetails]);

  // 🔁 전역 메모 보기 모드 (K&N / R)
  const memoViewMode = useMemoViewMode((s) => s.mode); // "public" | "secret"
  const isPublicMemoMode = memoViewMode === "public";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        document
          ?.querySelector<HTMLButtonElement>("[data-pvm-initial]")
          ?.focus();
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // 배경 클릭 → 닫기 (포털 모드에서만 사용)
  const onDimClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      eat(e);
      onClose();
    },
    [onClose]
  );

  // ✨ 콘텐츠 패널에만 버블 단계 전파 차단 (포털 모드에서만 사용)
  const stopBubble = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleClickEdit = useCallback(() => {
    // ✅ 모바일 + 토글 OFF면 수정 진입 막기
    if (!canEditProperty) {
      toast({
        title: "모바일에서 수정이 제한됩니다",
        description: "매물정보 수정은 PC 환경에서만 가능합니다.",
      });
      return;
    }

    const imageCardCounts =
      (f as any).imageCardCounts ??
      (Array.isArray(f.cardsHydrated)
        ? (f.cardsHydrated as any[]).map((c: any[]) => c.length)
        : undefined);

    /** ✅ raw/view가 들어있는 최초 initialForEdit 를 베이스로 쓰되,
     *     view 쪽은 항상 최신 data 로 덮어써서(= merge) 향/개별평수 등 수정값을 반영
     */
    const baseInitial = (initialForEdit as any) ?? {};

    const prevView: Partial<PropertyViewDetails> = {
      // 1) 최초 진입 시 쿼리 결과/부모 prop 으로 만들어진 view
      ...(baseInitial.view ?? {}),
      // 2) 뷰 모달이 지금 보고 있는 최신 data (수정 저장 후의 값들 포함)
      ...(data ?? {}),
    };

    /** ✅ raw 는 그대로 두고, view 에만 이미지/향/개별평수 등을 최신 상태로 덮어쓰기 */
    const editSeed = {
      ...baseInitial,
      view: {
        ...prevView,
        // 이미지(폴더/세로사진)
        imageFolders: f.cardsHydrated ?? undefined,
        verticalImages: f.filesHydrated ?? undefined,
        imageCardCounts,
        // 향 / 면적 / 개별평수 등도 최신 뷰 폼 상태로 덮어쓰기 (혹시라도 누락 방지용)
        aspects: (f as any).aspects,
        exclusiveArea: (f as any).exclusiveArea,
        realArea: (f as any).realArea,
        extraExclusiveAreas: (f as any).extraExclusiveAreas,
        extraRealAreas: (f as any).extraRealAreas,
        baseAreaTitle: (f as any).baseAreaTitleView,
        extraAreaTitles: (f as any).extraAreaTitlesView,
        unitLines: (f as any).unitLines,
      },
    };

    onRequestEdit(editSeed);
  }, [canEditProperty, toast, f, data, onRequestEdit, initialForEdit]);

  const panelClass = cn(
    "bg-white shadow-xl overflow-hidden flex flex-col",
    "w-screen h-screen max-w-none max-h-none rounded-none",
    "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl"
  );

  const positionedPanelClass = cn(
    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    panelClass
  );

  if (loading && !hasData) {
    const panel = (
      <div
        className={asInner ? panelClass : positionedPanelClass}
        {...(!asInner && {
          onMouseDown: stopBubble,
          onPointerDown: stopBubble,
          onKeyDownCapture: (e: React.KeyboardEvent) => {
            if (e.key === "Escape") e.stopPropagation();
          },
        })}
      >
        <ViewLoadingSkeleton onClose={onClose} headingId={headingId} />
      </div>
    );

    if (asInner) {
      return panel;
    }

    return (
      <div
        className="fixed inset-0 z-[99999]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={onDimClick}
          aria-label="닫기"
          title="닫기"
        />
        {panel}
      </div>
    );
  }

  const panel = (
    <div
      className={asInner ? panelClass : positionedPanelClass}
      {...(!asInner && {
        onMouseDown: stopBubble,
        onPointerDown: stopBubble,
        onKeyDownCapture: (e: React.KeyboardEvent) => {
          if (e.key === "Escape") e.stopPropagation();
        },
      })}
    >
      {hasData ? (
        <>
          <div className="sticky top-0 z-10 bg-white border-b">
            <HeaderViewContainer
              title={f.title}
              parkingGrade={f.parkingGrade}
              elevator={f.elevator}
              pinKind={f.pinKind}
              headingId={headingId}
              descId={descId}
              ageType={ageType}
              completionDate={
                (data as any)?.completionDate ??
                (f as any)?.completionDate ??
                null
              }
              newYearsThreshold={5}
              // ⭐ rebateText를 헤더로 전달 (뷰데이터 우선, 없으면 폼 값)
              rebateText={rebateTextFromSources}
            />
          </div>

          <div
            className={cn(
              "flex-1 min_h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
              "px-4 py-4 md:px-5 md:py-4",
              "grid gap-4 md:gap-6",
              "grid-cols-1 md:grid-cols-[300px_1fr]"
            )}
          >
            <div className="space-y-4">
              <DisplayImagesContainer
                cards={f.cardsHydrated}
                images={f.imagesProp}
                files={f.filesHydrated}
              />
            </div>

            <div className="space-y-4 md:space-y-6">
              <BasicInfoViewContainer
                address={f.address ?? ""}
                officePhone={f.officePhone ?? ""}
                officePhone2={f.officePhone2 ?? ""}
              />
              <NumbersViewContainer
                totalBuildings={f.totalBuildings}
                totalFloors={f.totalFloors}
                totalHouseholds={f.totalHouseholds}
                remainingHouseholds={f.remainingHouseholds}
              />
              <ParkingViewContainer
                parkingType={parkingTypeResolved}
                totalParkingSlots={
                  (f as any).totalParkingSlots ??
                  (data as any)?.totalParkingSlots ??
                  (data as any)?.parkingCount ??
                  undefined
                }
              />
              <CompletionRegistryViewContainer
                completionDate={f.completionDateText}
                registry={f.registry}
                slopeGrade={f.slopeGrade}
                structureGrade={f.structureGrade}
                minRealMoveInCost={(f as any).minRealMoveInCost}
                elevator={
                  // 1순위: 폼 상태에 문자열 "O"/"X"가 있으면 사용
                  (f as any).elevator ??
                  // 2순위: 뷰 데이터에 문자열 elevator 필드가 있으면 사용
                  (data as any)?.elevator ??
                  // 3순위: 서버에서 내려온 boolean hasElevator 사용
                  (data as any)?.hasElevator ??
                  null
                }
              />

              <AspectsViewContainer details={data!} />
              <AreaSetsViewContainer
                exclusiveArea={f.exclusiveArea}
                realArea={f.realArea}
                extraExclusiveAreas={f.extraExclusiveAreas}
                extraRealAreas={f.extraRealAreas}
                baseAreaTitle={f.baseAreaTitleView}
                extraAreaTitles={f.extraAreaTitlesView}
              />
              <StructureLinesListContainer
                lines={f.unitLines}
                units={(f as any).units}
              />
              <OptionsBadgesContainer
                options={f.options}
                optionEtc={f.optionEtc}
              />

              {/* 🔁 전역 토글 상태에 따라 한 종류의 메모만 전달 */}
              <MemosContainer
                publicMemo={isPublicMemoMode ? f.publicMemo : undefined}
                secretMemo={!isPublicMemoMode ? f.secretMemo : undefined}
              />

              {/* 👇 생성자/답사자/수정자 메타 정보 (메모 밑) */}
              <MetaInfoContainer details={metaDetails} />

              <div className="h-16 md:hidden" />
            </div>
          </div>

          <ViewActionsBar
            showEditButton={showEditButton}
            canDelete={canDelete}
            deleting={deleting}
            hasId={!!data?.id}
            onClickEdit={handleClickEdit}
            onDelete={onDelete}
            onClose={onClose}
          />
        </>
      ) : (
        <ViewLoadingSkeleton onClose={onClose} headingId={headingId} />
      )}
    </div>
  );

  if (asInner) {
    return panel;
  }

  return (
    <div
      className="fixed inset-0 z-[99999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onDimClick}
        aria-label="닫기"
        title="닫기"
      />
      {panel}
    </div>
  );
}
