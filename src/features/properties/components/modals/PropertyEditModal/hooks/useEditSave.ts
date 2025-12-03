"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { updatePin, type UpdatePinDto } from "@/shared/api/pins";
import { buildUpdatePayload } from "../lib/buildUpdatePayload/buildUpdatePayload";
import type { PinPhotoGroup } from "@/shared/api/photoGroups";
import type { BuildingType } from "@/features/properties/types/property-domain";

import {
  isValidIsoDateStrict,
  isValidPhoneKR,
  normalizeDateInput,
  validateAreaRanges,
  validateUnitPriceRanges,
} from "../lib/editValidation";
import {
  deepPrune,
  hasMeaningfulPatch,
  InitialSnapshot,
  stripNoopNulls,
  toPinPatch,
} from "../lib/toPinPatch";
import { useEditForm } from "./useEditForm/useEditForm";

/** useEditForm 반환 타입 추출 */
type UseEditFormReturn = ReturnType<typeof useEditForm>;

/** 건물 연식 그레이드: "new"/"old" + 초기값들까지 허용 */
type BuildingGradeLoose = "new" | "old" | "" | null | undefined;

type UseEditSaveArgs = {
  form: UseEditFormReturn;
  bridgedInitial: InitialSnapshot | null;
  propertyId: string;

  // 건물 연식 관련 메타
  buildingGrade: BuildingGradeLoose;
  buildingGradeTouched: boolean;
  hadAgeFlags: boolean;
  initialBuildingGrade: BuildingGradeLoose;

  // 미디어 관련
  groups: PinPhotoGroup[] | undefined;
  imageFolders: any[] | undefined;
  verticalImages: any[] | undefined;
  hasImageChanges?: () => boolean;
  commitImageChanges?: () => Promise<boolean | void>;
  commitPending?: () => Promise<boolean | void>;

  // 알림 & 콜백
  showAlert: (msg: string) => void;
  onSubmit?: (payload: any) => void | Promise<void>;
  onClose: () => void;

  /** 🔁 수정 저장 성공 시 지도용 GET(/map) 같이 호출할 콜백 */
  onLabelChanged?: () => void | Promise<void>;
};

export function useEditSave({
  form: f,
  bridgedInitial,
  propertyId,
  buildingGrade,
  buildingGradeTouched,
  hadAgeFlags,
  initialBuildingGrade,
  groups,
  imageFolders,
  verticalImages,
  hasImageChanges,
  commitImageChanges,
  commitPending,
  showAlert,
  onSubmit,
  onClose,
  onLabelChanged,
}: UseEditSaveArgs) {
  const queryClient = useQueryClient();

  /** 저장 가능 여부: 폼 변경 or 이미지 변경 */
  const canSaveNow = useMemo<boolean>(
    () => !!(f.isSaveEnabled || hasImageChanges?.()),
    [f.isSaveEnabled, hasImageChanges]
  );

  const save = useCallback(async () => {
    console.groupCollapsed("[save] start");
    console.log("[save] current buildingGrade:", buildingGrade);
    console.log(
      "[save] buildingGradeTouched:",
      buildingGradeTouched,
      "hadAgeFlags:",
      hadAgeFlags
    );
    console.log("[save] current pinKind:", f.pinKind);

    if (!f.title.trim()) {
      console.groupEnd();
      showAlert("이름(제목)을 입력하세요.");
      return;
    }

    // ✅ 전화번호 형식 검증
    if (!isValidPhoneKR(f.officePhone)) {
      console.groupEnd();
      showAlert("전화번호를 입력해주세요");
      return;
    }
    if ((f.officePhone2 ?? "").trim() && !isValidPhoneKR(f.officePhone2)) {
      console.groupEnd();
      showAlert("전화번호를 입력해주세요");
      return;
    }

    // ✅ 준공일 형식 검증
    {
      const raw = f.completionDate?.trim() ?? "";
      if (raw) {
        const normalized = normalizeDateInput(raw);
        if (normalized !== raw) f.setCompletionDate(normalized);
        if (!isValidIsoDateStrict(normalized)) {
          console.groupEnd();
          showAlert(
            " 준공일은 YYYY-MM-DD 형식으로 입력해주세요.\n예: 2024-04-14"
          );
          return;
        }
      }
    }

    // ✅ 면적 제약
    {
      const msg = validateAreaRanges(f.baseAreaSet, f.extraAreaSets);
      if (msg) {
        console.groupEnd();
        showAlert(msg);
        return;
      }
    }

    // ✅ 유닛 가격 제약
    {
      const msg = validateUnitPriceRanges(f.unitLines);
      if (msg) {
        console.groupEnd();
        showAlert(msg);
        return;
      }
    }

    let dto: UpdatePinDto | null = null;
    let hasFormChanges = false;

    try {
      const raw = toPinPatch(f, (bridgedInitial ?? {}) as InitialSnapshot);

      // 초기 데이터에 향/방향 값이 전무하면 이번 PATCH에서 삭제 (directions는 유지)
      const initAspectBundle = {
        aspect: (bridgedInitial as any)?.aspect,
        aspectNo: (bridgedInitial as any)?.aspectNo,
        aspect1: (bridgedInitial as any)?.aspect1,
        aspect2: (bridgedInitial as any)?.aspect2,
        aspect3: (bridgedInitial as any)?.aspect3,
        orientations: (bridgedInitial as any)?.orientations,
      };
      const _norm = (v: any) => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === "" || s === "-" || s === "—" ? undefined : s;
      };
      const initHasAspect =
        !!_norm(initAspectBundle.aspect) ||
        !!_norm(initAspectBundle.aspectNo) ||
        !!_norm(initAspectBundle.aspect1) ||
        !!_norm(initAspectBundle.aspect2) ||
        !!_norm(initAspectBundle.aspect3) ||
        (Array.isArray(initAspectBundle.orientations) &&
          initAspectBundle.orientations.length > 0);

      if (!initHasAspect) {
        delete (raw as any).aspect;
        delete (raw as any).aspectNo;
        delete (raw as any).aspect1;
        delete (raw as any).aspect2;
        delete (raw as any).aspect3;
        delete (raw as any).orientations;
      }

      dto = deepPrune(raw) as UpdatePinDto;

      // 🔧 무의미한 null/빈값 제거 + [] 방지 (directions/units 보존)
      dto = stripNoopNulls(dto, bridgedInitial) as UpdatePinDto;
      console.log(
        "[save] stripNoopNulls 이후 dto.areaGroups:",
        (dto as any).areaGroups
      );

      if (
        (dto as any)?.areaGroups &&
        Array.isArray((dto as any).areaGroups) &&
        (dto as any).areaGroups.length === 0
      ) {
        console.log("[save] areaGroups가 빈 배열 → 키 제거");
        delete (dto as any).areaGroups;
      }

      // ✅ buildingGrade → 서버로 보낼지 결정
      if (
        buildingGradeTouched ||
        !hadAgeFlags ||
        buildingGrade !== initialBuildingGrade
      ) {
        (dto as any).isNew = buildingGrade === "new";
        (dto as any).isOld = buildingGrade === "old";
      }

      console.log("[save] final toggles (diffed):", {
        buildingGrade,
        buildingGradeTouched,
        hadAgeFlags,
        isNew: (dto as any).isNew,
        isOld: (dto as any).isOld,
        pinKind: (dto as any).pinKind ?? f.pinKind,
        buildingType: (dto as any).buildingType,
        registry: (dto as any).registry,
      });

      hasFormChanges = hasMeaningfulPatch(dto);

      console.groupCollapsed("[save] after toPinPatch+strip (diffed only)");
      console.log("[save] dto:", dto);
      console.log("[save] hasFormChanges:", hasFormChanges);
      console.groupEnd();
    } catch (e: any) {
      console.error("[toPinPatch] 실패:", e);
      console.groupEnd();
      showAlert(e?.message || "변경 사항 계산 중 오류가 발생했습니다.");
      return;
    }

    // 1) 사진 커밋
    try {
      await (commitImageChanges?.() ?? commitPending?.());
    } catch (e: any) {
      console.error("[images.commit] 실패:", e);
      console.groupEnd();
      showAlert(e?.message || "이미지 변경사항 반영에 실패했습니다.");
      return;
    }

    // 2) 폼 PATCH
    if (!(f as any).aspectsTouched && dto && (dto as any).directions) {
      delete (dto as any).directions;
    }

    if (hasFormChanges && dto && Object.keys(dto).length > 0) {
      console.log("[save] → will PATCH /pins/:id", propertyId, "with", dto);
      try {
        console.log("PATCH /pins/:id payload", dto);
        await updatePin(propertyId, dto);

        // 상세 쿼리 invalidate
        await queryClient.invalidateQueries({
          queryKey: ["pinDetail", propertyId],
        });

        // 🔥 여기서: 수정 성공 시마다 map 갱신 콜백 호출
        if (onLabelChanged) {
          try {
            await onLabelChanged();
          } catch (e) {
            console.error("[save] onLabelChanged 실행 중 오류:", e);
          }
        }
      } catch (e: any) {
        console.error("[PATCH /pins/:id] 실패:", e);
        console.groupEnd();
        showAlert(e?.message || "핀 수정 중 오류가 발생했습니다.");
        return;
      }
    } else {
      console.log("[save] no form changes → skip PATCH");
    }

    // 3) 로컬 view 갱신 + 뷰 모달로 복귀
    try {
      const groupsList = (groups ?? []) as PinPhotoGroup[];

      // 0) 가로 그룹만 골라서 정렬
      const horizGroupsForView = groupsList
        .filter((g) => g.isDocument !== true)
        .slice()
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.title ?? "").localeCompare(String(b.title ?? ""))
        );

      // 1) imageFolders에 서버 그룹 title을 덮어쓴 뷰용 스냅샷
      const imageFoldersForPayload = (imageFolders ?? []).map(
        (folder: any, idx: number) => {
          const g = horizGroupsForView[idx];
          const groupTitle = typeof g?.title === "string" ? g.title.trim() : "";

          return {
            ...folder,
            title: groupTitle || folder?.title || "",
          };
        }
      );

      // 2) 향/면적 등 현재 폼 스냅샷 얻기
      const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
        f.buildOrientation();
      const {
        exclusiveArea,
        realArea,
        extraExclusiveAreas,
        extraRealAreas,
        baseAreaTitleOut,
        extraAreaTitlesOut,
      } = f.packAreas();

      // 🔽 buildUpdatePayload가 기대하는 타입("new" | "old" | undefined)으로 정규화
      const normalizedBuildingGrade: "new" | "old" | undefined =
        buildingGrade === "new" || buildingGrade === "old"
          ? buildingGrade
          : undefined;

      const payload = buildUpdatePayload(
        {
          title: f.title,
          address: f.address,
          officeName: f.officeName,
          officePhone: f.officePhone,
          officePhone2: f.officePhone2,
          moveIn: f.moveIn,
          floor: f.floor,
          roomNo: f.roomNo,
          structure: f.structure,

          parkingGrade: f.parkingGrade,
          parkingType: f.parkingType,
          totalParkingSlots: f.totalParkingSlots,
          completionDate: f.completionDate,
          salePrice: f.salePrice,
          rebateText: f.rebateText,

          baseAreaSet: f.baseAreaSet,
          extraAreaSets: f.extraAreaSets,
          exclusiveArea,
          realArea,
          extraExclusiveAreas,
          extraRealAreas,
          baseAreaTitleOut,
          extraAreaTitlesOut,

          elevator: f.elevator,
          slopeGrade: f.slopeGrade,
          structureGrade: f.structureGrade,

          totalBuildings: f.totalBuildings,
          totalFloors: f.totalFloors,
          totalHouseholds: f.totalHouseholds,
          remainingHouseholds: f.remainingHouseholds,

          options: f.options,
          etcChecked: f.etcChecked,
          optionEtc: f.optionEtc,
          publicMemo: f.publicMemo,
          secretMemo: f.secretMemo,

          orientations,
          aspect: aspect ?? "",
          aspectNo: Number(aspectNo ?? 0),
          aspect1,
          aspect2,
          aspect3,
          unitLines: f.unitLines,

          imageFolders: imageFoldersForPayload,
          verticalImages,

          pinKind: f.pinKind,
          buildingGrade: normalizedBuildingGrade,
          buildingType: f.buildingType as BuildingType | null,
        },
        (bridgedInitial as any) ?? {}
      );

      console.log("[save] onSubmit payload (view sync):", {
        buildingGrade: normalizedBuildingGrade,
        pinKind: f.pinKind,
        title: payload.title,
      });

      if (onSubmit) {
        await onSubmit(payload as any);
      }
    } catch (e: any) {
      console.error("[save] view sync/buildUpdatePayload 실패:", e);
      showAlert(
        e?.message ||
          "화면 갱신 중 오류가 발생했지만,\n서버에는 변경 사항이 저장되었습니다."
      );
    } finally {
      console.groupEnd();
      onClose();
    }
  }, [
    f,
    bridgedInitial,
    propertyId,
    groups,
    imageFolders,
    verticalImages,
    commitImageChanges,
    commitPending,
    buildingGrade,
    buildingGradeTouched,
    hadAgeFlags,
    initialBuildingGrade,
    showAlert,
    onSubmit,
    onClose,
    onLabelChanged,
    queryClient,
  ]);

  return { save, canSaveNow };
}
