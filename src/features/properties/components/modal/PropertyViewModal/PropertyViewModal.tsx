"use client";

import { useEffect, useRef, useState } from "react";
import { get as idbGet } from "idb-keyval";
import { Trash2, Pencil } from "lucide-react";
import type { PropertyViewDetails } from "@/features/properties/types/property-view";

import HeaderSectionView from "./view/HeaderSectionView";
import DisplayImagesSection from "./view/DisplayImagesSection";
import BasicInfoView from "./view/BasicInfoView";
import NumbersView from "./view/NumbersView";
import ParkingView from "./view/ParkingView";
import CompletionRegistryView from "./view/CompletionRegistryView";
import AspectsView from "./view/AspectsView";
import AreaSetsView from "./view/AreaSetsView";
import StructureLinesList from "./view/StructureLinesList";
import OptionsBadges from "./view/OptionsBadges";
import MemoPanel from "./view/MemoPanel";

/* ---------- 타입 ---------- */
type AnyImageRef =
  | string
  | { url?: string; name?: string; caption?: string }
  | { idbKey: string; name?: string; caption?: string };

type UIImg = { url: string; name?: string; caption?: string };

type MemoTab = "KN" | "R";

const toYMD = (
  v: string | Date | null | undefined
): string | null | undefined => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v ?? null;
};

export default function PropertyViewModal({
  open,
  onClose,
  data,
  onSave,
  onDelete,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  data: PropertyViewDetails;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
}) {
  const [memoTab, setMemoTab] = useState<MemoTab>("KN");

  // ✅ 복원된(수화된) 이미지 상태 (카드/세로/레거시 평탄)
  const [cardsHydrated, setCardsHydrated] = useState<UIImg[][]>([[]]);
  const [filesHydrated, setFilesHydrated] = useState<UIImg[]>([]);
  const [legacyImagesHydrated, setLegacyImagesHydrated] = useState<
    string[] | undefined
  >(undefined);

  // 카드 우선 여부(있으면 images prop은 undefined로 넘긴다)
  const [preferCards, setPreferCards] = useState<boolean>(false);

  // 생성된 objectURL 정리용
  const createdObjectUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      createdObjectUrlsRef.current = [];
    };
  }, []);

  // ------- IDB 이미지 복원 유틸 -------
  const resolveImageRef = async (u: AnyImageRef): Promise<UIImg | null> => {
    if (typeof u === "string") return { url: u };

    if (u && "idbKey" in (u as any) && typeof (u as any).idbKey === "string") {
      try {
        const key = (u as any).idbKey as string;
        if (key.startsWith("url:")) {
          const url = key.slice(4);
          return {
            url,
            name: (u as any).name,
            ...((u as any).caption ? { caption: (u as any).caption } : {}),
          };
        }
        const blob = await idbGet(key);
        if (!blob) return null;
        const objectUrl = URL.createObjectURL(blob);
        createdObjectUrlsRef.current.push(objectUrl);
        return {
          url: objectUrl,
          name: (u as any).name,
          ...((u as any).caption ? { caption: (u as any).caption } : {}),
        };
      } catch {
        return null;
      }
    }

    if (
      u &&
      typeof u === "object" &&
      "url" in u &&
      typeof (u as any).url === "string"
    ) {
      return {
        url: (u as any).url,
        name: (u as any).name,
        ...((u as any).caption ? { caption: (u as any).caption } : {}),
      };
    }

    return null;
  };

  const hydrateCards = async (src: AnyImageRef[][]): Promise<UIImg[][]> => {
    const cards = await Promise.all(
      src.map(async (card) => {
        const resolved = await Promise.all(card.map(resolveImageRef));
        return resolved.filter(Boolean) as UIImg[];
      })
    );
    return cards.length ? cards : [[]];
  };

  const hydrateFlatUsingCounts = async (
    src: AnyImageRef[],
    counts: number[]
  ): Promise<UIImg[][]> => {
    const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
      Boolean
    ) as UIImg[];
    const out: UIImg[][] = [];
    let offset = 0;
    for (const c of counts) {
      out.push(resolved.slice(offset, offset + c));
      offset += c;
    }
    if (offset < resolved.length) out.push(resolved.slice(offset));
    return out.length ? out : [[]];
  };

  const hydrateFlatToCards = async (
    src: AnyImageRef[],
    chunk = 20
  ): Promise<UIImg[][]> => {
    const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
      Boolean
    ) as UIImg[];
    const out: UIImg[][] = [];
    for (let i = 0; i < resolved.length; i += chunk) {
      out.push(resolved.slice(i, i + chunk));
    }
    return out.length ? out : [[]];
  };

  const hydrateVertical = async (src: AnyImageRef[]): Promise<UIImg[]> => {
    const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
      Boolean
    ) as UIImg[];
    return resolved;
  };
  // -------------------------------------

  useEffect(() => {
    if (!open || !data) return;

    (async () => {
      // ✅ 우선순위: imageFolders > imagesByCard > imageCards > (images + imageCardCounts) > images

      const foldersRaw =
        (data as any).imageFolders ??
        (data as any).imagesByCard ??
        (data as any).imageCards ??
        (data as any)._imageCardRefs ?? // 선택 사항(안전망)
        null;

      const flat = Array.isArray((data as any).images)
        ? ((data as any).images as AnyImageRef[])
        : null;
      const counts: number[] | undefined = (data as any).imageCardCounts;

      if (Array.isArray(foldersRaw) && foldersRaw.length > 0) {
        setPreferCards(true);
        setCardsHydrated(await hydrateCards(foldersRaw as AnyImageRef[][]));
      } else if (
        flat &&
        flat.length > 0 &&
        Array.isArray(counts) &&
        counts.length > 0
      ) {
        setPreferCards(true);
        setCardsHydrated(await hydrateFlatUsingCounts(flat, counts));
      } else if (flat && flat.length > 0) {
        setPreferCards(true);
        setCardsHydrated(await hydrateFlatToCards(flat, 20));
      } else {
        setPreferCards(false);
        setCardsHydrated([[]]);
      }

      // 세로 카드: verticalImages > imagesVertical > fileItems
      const verticalRaw =
        (data as any).verticalImages ??
        (data as any).imagesVertical ??
        (data as any).fileItems ??
        (data as any)._fileItemRefs ??
        null;

      if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
        setFilesHydrated(await hydrateVertical(verticalRaw as AnyImageRef[]));
      } else {
        setFilesHydrated([]);
      }

      // 카드 소스가 전혀 없는 “레거시-only”에서만 images를 따로 뽑아둔다
      if (flat && flat.length > 0 && !Array.isArray(foldersRaw)) {
        const resolved = (await Promise.all(flat.map(resolveImageRef))).filter(
          Boolean
        ) as UIImg[];
        setLegacyImagesHydrated(resolved.map((r) => r.url));
      } else {
        setLegacyImagesHydrated(undefined);
      }
    })();
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !data) return null;

  // preferCards가 true면 images를 undefined로 넘겨서 카드 렌더를 강제
  const imagesProp = preferCards ? undefined : legacyImagesHydrated;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <HeaderSectionView
          title={data.title ?? ""}
          listingStars={data.listingStars ?? 0}
          elevator={(data.elevator as "O" | "X") ?? "O"}
          onClose={onClose}
        />

        {/* 본문 */}
        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          {/* 좌: 이미지 카드 */}
          <div className="space-y-4">
            <DisplayImagesSection
              // 🔑 이제는 수화된 상태를 그대로 사용
              cards={cardsHydrated}
              images={imagesProp}
              files={filesHydrated}
            />
          </div>

          {/* 우: 상세 정보 */}
          <div className="space-y-6">
            <BasicInfoView
              address={data.address ?? ""}
              officePhone={data.officePhone ?? ""}
              officePhone2={data.officePhone2 ?? ""}
            />

            <NumbersView
              totalBuildings={data.totalBuildings}
              totalFloors={data.totalFloors}
              totalHouseholds={data.totalHouseholds}
              remainingHouseholds={data.remainingHouseholds}
            />

            <ParkingView
              parkingType={data.parkingType ?? ""}
              parkingCount={data.parkingCount}
            />

            <CompletionRegistryView
              completionDate={toYMD(data.completionDate)}
              salePrice={data.salePrice}
              registry={data.registry}
              slopeGrade={data.slopeGrade}
              structureGrade={data.structureGrade}
            />

            <AspectsView details={data} />

            <AreaSetsView
              exclusiveArea={data.exclusiveArea}
              realArea={data.realArea}
              extraExclusiveAreas={data.extraExclusiveAreas}
              extraRealAreas={data.extraRealAreas}
            />

            <StructureLinesList
              lines={Array.isArray(data.unitLines) ? data.unitLines : []}
            />

            <OptionsBadges
              options={data.options ?? []}
              optionEtc={data.optionEtc ?? ""}
            />

            {/* 메모 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">메모</div>
                <div className="inline-flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMemoTab("KN")}
                    className={`px-3 h-8 text-sm ${
                      memoTab === "KN"
                        ? "bg-amber-500 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    K&N
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoTab("R")}
                    className={`px-3 h-8 text-sm border-l ${
                      memoTab === "R"
                        ? "bg-rose-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    R
                  </button>
                </div>
              </div>

              {memoTab === "KN" ? (
                <MemoPanel mode="KN" value={data.publicMemo ?? ""} />
              ) : (
                <MemoPanel mode="R" value={data.secretMemo ?? ""} />
              )}
            </div>
          </div>
        </div>

        {/* 하단: 수정/삭제/닫기 */}
        <div className="px-5 py-3 border-t flex items-center justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={async () => {
                  await onEdit();
                }}
                className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-blue-600 hover:bg-blue-50"
                aria-label="수정"
                title="수정"
              >
                <Pencil className="h-4 w-4" />
                수정
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("정말 삭제할까요?")) return;
                  await onDelete();
                }}
                className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-red-600 hover:bg-red-50"
                aria-label="삭제"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border px-3 h-9 hover:bg-muted"
            aria-label="닫기"
            title="닫기"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
