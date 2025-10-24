"use client";

import { useRef, useState, useCallback } from "react";

import FooterButtons from "../sections/FooterButtons/FooterButtons";
import type { PropertyCreateModalProps } from "./types";
import {
  MAX_FILES,
  MAX_PER_CARD,
  PRESET_OPTIONS,
  STRUCTURE_PRESETS,
} from "../constants";
import { usePropertyImages } from "./hooks/usePropertyImages";
import { buildCreatePayload } from "./lib/buildCreatePayload";
import { useCreateForm } from "./hooks/useCreateForm/useCreateForm";
import { REGISTRY_LIST } from "@/features/properties/types/property-domain";

// UI 컨테이너
import HeaderContainer from "./ui/HeaderContainer";
import ImagesContainer from "./ui/ImagesContainer";
import BasicInfoContainer from "./ui/BasicInfoContainer";
import NumbersContainer from "./ui/NumbersContainer";
import ParkingContainer from "./ui/ParkingContainer";
import CompletionRegistryContainer from "./ui/CompletionRegistryContainer";
import AspectsContainer from "./ui/AspectsContainer";
import AreaSetsContainer from "./ui/AreaSetsContainer";
import StructureLinesContainer from "./ui/StructureLinesContainer";
import OptionsContainer from "./ui/OptionsContainer";
import MemosContainer from "./ui/MemosContainer";
import { mapPinKindToBadge } from "../../lib/badge";

// ✅ /pins 호출 유틸과 api 클라이언트 임포트
import { api } from "@/shared/api/api"; // 예약 삭제용
import { createPin, CreatePinDto } from "@/shared/api/pins";

/** 주소 → 카카오 지오코딩 */
function geocodeKakao(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    try {
      const { kakao } = window as any;
      if (!kakao?.maps?.services?.Geocoder) return resolve(null);
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (results: any[], status: any) => {
        if (status !== kakao.maps.services.Status.OK || !results?.length) {
          return resolve(null);
        }
        const r = results[0];
        const lat = Number(r.y);
        const lng = Number(r.x);
        if (Number.isFinite(lat) && Number.isFinite(lng)) resolve({ lat, lng });
        else resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
}: Omit<PropertyCreateModalProps, "open">) {
  // 모든 상태/액션
  const f = useCreateForm({ initialAddress });

  // 이미지 훅
  const {
    imageFolders,
    fileItems,
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  } = usePropertyImages();

  // 중복 저장 가드
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (!f.title.trim()) return;

      // ✅ 좌표 확보 (여러 후보에서 숫자로 파싱)
      const candidatesLat = [
        (f as any).lat,
        (f as any).position?.lat,
        (f as any).mapCenter?.lat,
        (f as any).geo?.lat,
        (f as any).address?.lat,
      ];
      const candidatesLng = [
        (f as any).lng,
        (f as any).position?.lng,
        (f as any).mapCenter?.lng,
        (f as any).geo?.lng,
        (f as any).address?.lng,
      ];

      let latCandidate = candidatesLat.map(Number).find(Number.isFinite);
      let lngCandidate = candidatesLng.map(Number).find(Number.isFinite);

      // 🔁 후보에서 못 찾았으면 주소로 카카오 지오코딩 시도
      if (
        (!Number.isFinite(latCandidate!) || !Number.isFinite(lngCandidate!)) &&
        f.address
      ) {
        const geo = await geocodeKakao(String(f.address));
        if (geo) {
          latCandidate = geo.lat;
          lngCandidate = geo.lng;
        }
      }

      // 최종 검증
      if (!Number.isFinite(latCandidate!) || !Number.isFinite(lngCandidate!)) {
        alert(
          "좌표가 없습니다. 지도에서 위치를 선택하거나 주소를 더 정확히 입력해 주세요."
        );
        return;
      }

      // ✅ 확정 숫자
      const latNum = Number(latCandidate);
      const lngNum = Number(lngCandidate);

      // 배지/날짜 계산 (YYYY-MM-DD)
      const badgeFromKind = mapPinKindToBadge(f.pinKind);
      const effectiveBadge = f.badge ?? badgeFromKind ?? undefined;
      const effectiveCompletionDate =
        typeof f.completionDate === "string" && f.completionDate.trim() !== ""
          ? f.completionDate
          : new Date().toISOString().slice(0, 10);

      // 매물 payload (내부 가공용)
      const payload = buildCreatePayload({
        title: f.title,
        address: f.address,
        badge: effectiveBadge,
        officeName: f.officeName,
        officePhone: f.officePhone,
        officePhone2: f.officePhone2,
        moveIn: f.moveIn,
        floor: f.floor,
        roomNo: f.roomNo,
        structure: f.structure,
        listingStars: f.listingStars,
        parkingType: f.parkingType,
        parkingCount: f.parkingCount,
        completionDate: effectiveCompletionDate,
        salePrice: f.salePrice,
        baseAreaSet: f.baseAreaSet,
        extraAreaSets: f.extraAreaSets,
        elevator: f.elevator,
        registryOne: f.registryOne,
        slopeGrade: f.slopeGrade,
        structureGrade: f.structureGrade,
        totalBuildings: f.totalBuildings,
        totalFloors: f.totalFloors,
        totalHouseholds: f.totalHouseholds,
        remainingHouseholds: f.remainingHouseholds,

        // 추가 필드
        buildingType: (f as any).buildingType ?? null,
        registrationTypeId: (f as any).registrationTypeId ?? null,
        parkingTypeId: (f as any).parkingTypeId ?? null,

        options: f.options,
        etcChecked: f.etcChecked,
        optionEtc: f.optionEtc,
        publicMemo: f.publicMemo,
        secretMemo: f.secretMemo,
        aspects: f.aspects,
        unitLines: f.unitLines,
        imageFolders,
        fileItems,
        pinKind: f.pinKind,

        // 좌표 전달
        lat: latNum,
        lng: lngNum,
      });

      // ✅ /pins DTO로 매핑 (서버가 허용하는 필드만)
      const toNum = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const pinDto: CreatePinDto = {
        lat: latNum,
        lng: lngNum,
        addressLine: f.address ?? "",
        name: f.title ?? "임시 매물",
        contactMainLabel: (f.officeName ?? "").trim() || "대표",
        contactMainPhone: (f.officePhone ?? "").trim() || "010-0000-0000",

        // 선택 (서버 허용 범위에서만)
        completionDate: effectiveCompletionDate, // YYYY-MM-DD
        buildingType: (f as any).buildingType ?? null,
        totalHouseholds: toNum(f.totalHouseholds) ?? null,
        registrationTypeId: toNum((f as any).registrationTypeId) ?? null,
        parkingTypeId: toNum((f as any).parkingTypeId) ?? null,
        slopeGrade: f.slopeGrade ?? null,
        structureGrade: f.structureGrade ?? null,
        badge: effectiveBadge ?? null,
        publicMemo: f.publicMemo ?? null,
        privateMemo: f.secretMemo ?? null,
        hasElevator: f.elevator === "O",
      };

      // ✅ 핀 생성 (/pins)
      const { id: pinId, matchedDraftId } = await createPin(pinDto);

      // ✅ 예약 삭제 (있으면 id로, 없으면 draft 기준으로 탐색 후 삭제)
      const reservationId = (f as any).reservationId;
      const pinDraftId = (f as any).pinDraftId ?? matchedDraftId;
      try {
        if (reservationId != null) {
          await api.delete(`/survey-reservations/${reservationId}`);
        } else if (pinDraftId != null) {
          const listRes = await api.get("/survey-reservations/scheduled");
          const target = (listRes.data ?? []).find(
            (r: any) =>
              String(r?.pin_draft_id) === String(pinDraftId) ||
              String(r?.pin?.draftId) === String(pinDraftId)
          );
          if (target?.id != null) {
            await api.delete(`/survey-reservations/${target.id}`);
          }
        }
      } catch (err: any) {
        const st = err?.response?.status;
        if (st !== 404 && st !== 403) {
          console.warn("reservation cleanup failed:", err);
        }
      }

      // ✅ 부모에 결과만 전달 (부모에서 API 재호출 금지)
      await Promise.resolve(
        onSubmit?.({
          pinId: String(pinId),
          matchedDraftId,
          lat: latNum,
          lng: lngNum,
          payload, // 필요 없으면 types에서 제거해도 됨
        } as any)
      );

      onClose?.();
    } catch (e) {
      console.error("[PropertyCreate] save error:", e);
      const msg =
        (e as any)?.responseData?.messages?.join("\n") ||
        (e as any)?.message ||
        "저장 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.";
      alert(msg);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [f, imageFolders, fileItems, onSubmit, onClose]);

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        <HeaderContainer form={f} onClose={onClose} />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <ImagesContainer
            images={{
              imageFolders,
              fileItems,
              registerImageInput,
              openImagePicker,
              onPickFilesToFolder,
              addPhotoFolder,
              removePhotoFolder,
              onChangeImageCaption,
              handleRemoveImage,
              onAddFiles,
              onChangeFileItemCaption,
              handleRemoveFileItem,
              maxFiles: MAX_FILES,
              maxPerCard: MAX_PER_CARD,
            }}
          />

          <div className="space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />
            <ParkingContainer form={f} />
            <CompletionRegistryContainer
              form={f}
              REGISTRY_LIST={REGISTRY_LIST}
            />
            <AspectsContainer form={f} />
            <AreaSetsContainer form={f} />
            <StructureLinesContainer form={f} presets={STRUCTURE_PRESETS} />
            <OptionsContainer form={f} PRESET_OPTIONS={PRESET_OPTIONS} />
            <MemosContainer form={f} />
          </div>
        </div>

        <FooterButtons
          onClose={onClose}
          onSave={save}
          canSave={f.isSaveEnabled && !isSaving}
        />
      </div>
    </div>
  );
}
