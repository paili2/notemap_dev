"use client";

import { useEffect, useMemo, useRef } from "react";

import { normalizeInitialData } from "./normalize";
import type { UseEditFormArgs, UnitLine } from "./types";
import { resolveRegistryUi } from "./registry";
import type { BuildingType } from "@/features/properties/types/property-domain";
import { normalizeBuildingType } from "../../lib/buildingType";

type StarStr = "" | "1" | "2" | "3" | "4" | "5";

export type InitialForPatch = {
  contactMainPhone: string;
  contactSubPhone: string;
  minRealMoveInCost: string;
  unitLines: UnitLine[];
  initialName?: string;
  /** ✅ 유저가 모달 열었을 때의 엘리베이터 상태 */
  initialHasElevator?: boolean | null;
  /** ✅ 유저가 모달 열었을 때의 등기/건물유형(enum) */
  initialBuildingType?: BuildingType | null;
};

type Args = {
  initialData: UseEditFormArgs["initialData"];
  /** useEditForm에서 만든 api 객체 전체 (setter들을 여기서 사용) */
  api: any;
  /** aspectsTouchedRef (초기화용) */
  aspectsTouchedRef: React.MutableRefObject<boolean>;
};

export function useInjectInitialData({
  initialData,
  api,
  aspectsTouchedRef,
}: Args): InitialForPatch {
  const wrapper = initialData as any;
  const sourceData =
    (wrapper?.raw as any) ?? (wrapper?.view as any) ?? initialData ?? null;

  const initId: string | number | null =
    (wrapper?.id as any) ??
    (wrapper?.raw?.id as any) ??
    (wrapper?.view?.id as any) ??
    (wrapper?.raw?.propertyId as any) ??
    (wrapper?.view?.propertyId as any) ??
    (sourceData?.id as any) ??
    (sourceData?.propertyId as any) ??
    null;

  const initKey: string | number | null =
    initId ?? (sourceData ? "__NOID__" : null);

  const normalized = useMemo(() => {
    return normalizeInitialData(sourceData);
  }, [initKey, sourceData]);

  const injectedOnceRef = useRef<null | string | number>(null);

  const initialForPatchRef = useRef<InitialForPatch>({
    contactMainPhone: "",
    contactSubPhone: "",
    minRealMoveInCost: "",
    unitLines: [],
    initialBuildingType: null,
  });

  useEffect(() => {
    injectedOnceRef.current = null;
  }, [initKey]);

  useEffect(() => {
    if (initKey == null) return;
    if (injectedOnceRef.current === initKey) return;
    injectedOnceRef.current = initKey;

    // --- 편집 상태 플래그 초기화 ---
    aspectsTouchedRef.current = false;
    api.setAspectsTouched(false);
    api.setAreaSetsTouched(false);

    api.setPinKind(normalized.pinKind);
    api.setTitle(normalized.title);
    api.setAddress(normalized.address);
    api.setOfficePhone(normalized.officePhone);
    api.setOfficePhone2(normalized.officePhone2);
    api.setOfficeName(normalized.officeName);
    api.setMoveIn(normalized.moveIn);
    api.setFloor(normalized.floor);
    api.setRoomNo(normalized.roomNo);
    api.setStructure(normalized.structure);

    const pg = (normalized as any)?.parkingGrade as StarStr | undefined;
    api.setParkingGrade(pg && ["1", "2", "3", "4", "5"].includes(pg) ? pg : "");

    api.setParkingType(
      (normalized as any).parkingType != null
        ? (normalized as any).parkingType
        : null
    );

    api.setTotalParkingSlots(
      (normalized as any).totalParkingSlots != null
        ? String((normalized as any).totalParkingSlots)
        : ""
    );
    api.setCompletionDate(normalized.completionDate);
    api.setSalePrice(normalized.salePrice);

    // 🔥 리베이트 텍스트
    const rebateFromNormalized =
      (normalized as any).rebateText ??
      (normalized as any).rebateMemo ??
      (normalized as any).rebate ??
      undefined;

    const rebateFromSource =
      (sourceData as any)?.rebateText ??
      (sourceData as any)?.rebate ??
      (sourceData as any)?.rebateMemo ??
      undefined;

    api.setRebateText(
      rebateFromNormalized != null && rebateFromNormalized !== ""
        ? String(rebateFromNormalized)
        : rebateFromSource != null && rebateFromSource !== ""
        ? String(rebateFromSource)
        : ""
    );

    api.setBaseAreaSet(normalized.baseArea);
    api.setExtraAreaSets(normalized.extraAreas);

    /** 🔵 엘리베이터: 서버 값 → "O" | "X" 로 안전 정규화 */
    {
      const raw =
        (normalized as any).elevator ?? (normalized as any).hasElevator;
      let next: "O" | "X" = "O";
      if (raw === "O" || raw === "X") {
        next = raw;
      } else if (raw === true) {
        next = "O";
      } else if (raw === false) {
        next = "X";
      }
      api.setElevator(next);
    }

    const normGrade =
      (normalized as any)?.building?.grade ??
      (normalized as any)?.buildingGrade ??
      "";
    api.setBuildingGrade(
      normGrade === "new" || normGrade === "old" ? normGrade : ""
    );

    // ✅ registry UI 계산 (등기 상태용) — buildingType 과는 별개
    {
      const normRegRaw =
        (normalized as any).registry ??
        (normalized as any).registryOne ??
        (sourceData as any)?.registry ??
        undefined;

      // registry UI 에서 참고만 할 buildingType 원본
      const buildingTypeRawForRegistry: any =
        (normalized as any).buildingType ??
        (sourceData as any)?.buildingType ??
        (sourceData as any)?.propertyType ??
        (sourceData as any)?.type ??
        null;

      const finalRegistry = resolveRegistryUi({
        registryRaw: normRegRaw,
        buildingTypeRaw: buildingTypeRawForRegistry,
      });

      api.setRegistry(finalRegistry);
    }

    api.setSlopeGrade(normalized.slopeGrade);
    api.setStructureGrade(normalized.structureGrade);

    api.setTotalBuildings(
      (normalized.totalBuildings ?? "") as unknown as string
    );
    api.setTotalFloors((normalized.totalFloors ?? "") as unknown as string);
    api.setTotalHouseholds(
      (normalized.totalHouseholds ?? "") as unknown as string
    );
    api.setRemainingHouseholds(
      (normalized.remainingHouseholds ?? "") as unknown as string
    );

    // ✅ 옵션/직접입력 주입
    const normalizedOptions: any = (normalized as any).options;

    const presetOptions: string[] = Array.isArray(normalizedOptions)
      ? normalizedOptions
      : Array.isArray(normalizedOptions?.presetOptions)
      ? normalizedOptions.presetOptions
      : [];

    const extraCandidatesRaw: unknown[] = [
      (normalized as any).optionEtc,
      (normalized as any).extraOptionsText,
      normalizedOptions?.extraOptionsText,
      (sourceData as any)?.optionEtc,
      (sourceData as any)?.extraOptionsText,
      (sourceData as any)?.options?.extraOptionsText,
    ];

    const extraCandidates = Array.from(
      new Set(
        extraCandidatesRaw
          .map((v) => (v == null ? "" : String(v).trim()))
          .filter((v) => v.length > 0)
      )
    );

    const mergedOptionEtc = extraCandidates.join(", ");

    api.setOptions(presetOptions);
    api.setOptionEtc(mergedOptionEtc);

    api.setEtcChecked(
      Boolean(
        (normalized as any).etcChecked ||
          (mergedOptionEtc && mergedOptionEtc.trim().length > 0)
      )
    );

    api.setPublicMemo(normalized.publicMemo);
    api.setSecretMemo(normalized.secretMemo);
    api.setUnitLines(normalized.unitLines);
    api.setAspects(normalized.aspects);

    // ✅ buildingType: registry / buildingType / propertyType / type 를 한 번에 정규화
    let resolvedBt: BuildingType | null = null;
    {
      const rawCandidates: any[] = [
        // registry 계열 (예전 데이터에서 근생 등이 여기에만 들어있는 경우 우선)
        (normalized as any).registry,
        (normalized as any).registryOne,
        (sourceData as any)?.registry,
        (sourceData as any)?.registryOne,
        // buildingType 계열
        (normalized as any).buildingType,
        (sourceData as any)?.buildingType,
        (sourceData as any)?.propertyType,
        (sourceData as any)?.type,
      ];

      for (const cand of rawCandidates) {
        const norm = normalizeBuildingType(cand);
        if (norm) {
          resolvedBt = norm;
          break;
        }
      }

      console.log("[inject] buildingType candidates →", {
        rawCandidates,
        resolvedBt,
      });

      api.setBuildingType(resolvedBt);
    }

    // 🔥 initialForPatch 스냅샷
    initialForPatchRef.current = {
      contactMainPhone: normalized.officePhone ?? "",
      contactSubPhone: normalized.officePhone2 ?? "",
      minRealMoveInCost: normalized.salePrice ?? "",
      unitLines: (normalized.unitLines ?? []).map((u: UnitLine) => ({
        ...u,
      })),
      initialName:
        (normalized as any).title ??
        (normalized as any).name ??
        (sourceData as any)?.title ??
        (sourceData as any)?.name ??
        "",
      initialHasElevator:
        (normalized as any).hasElevator ??
        (typeof (normalized as any).elevator === "boolean"
          ? (normalized as any).elevator
          : (sourceData as any)?.hasElevator ??
            (typeof (sourceData as any)?.elevator === "boolean"
              ? (sourceData as any).elevator
              : null)),
      initialBuildingType: resolvedBt,
    };
  }, [initKey, normalized, sourceData, api, aspectsTouchedRef]);

  // registry / buildingType 변경 시에도 UI Registry를 재계산해서 동기화
  useEffect(() => {
    const normRegRaw =
      (normalized as any)?.registry ??
      (normalized as any)?.registryOne ??
      (sourceData as any)?.registry ??
      undefined;

    const buildingTypeRawForRegistry: any =
      (normalized as any).buildingType ??
      (sourceData as any)?.buildingType ??
      (sourceData as any)?.propertyType ??
      (sourceData as any)?.type ??
      null;

    const calculated = resolveRegistryUi({
      registryRaw: normRegRaw,
      buildingTypeRaw: buildingTypeRawForRegistry,
    });

    api.setRegistryOne((prev: any) => {
      if (prev && calculated && String(prev) === String(calculated))
        return prev;
      return calculated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    (normalized as any)?.registry,
    (normalized as any)?.registryOne,
    (normalized as any)?.buildingType,
    sourceData,
    api,
  ]);

  return initialForPatchRef.current;
}
