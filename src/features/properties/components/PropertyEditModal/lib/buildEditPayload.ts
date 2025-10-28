// "use client";

// import type { CreatePayload } from "@/features/properties/types/property-dto";
// import type {
//   Registry,
//   Grade,
//   UnitLine,
// } from "@/features/properties/types/property-domain";
// import type { ImageItem } from "@/features/properties/types/media";
// import type { AreaSet } from "../../sections/AreaSetsSection/types";
// import type { PinKind } from "@/features/pins/types";

// type BuildEditArgs = {
//   id: string;

//   // 기본
//   title: string;
//   address: string;
//   officeName: string;
//   officePhone: string;
//   officePhone2: string;
//   moveIn: string;
//   floor: string;
//   roomNo: string;
//   structure: string;

//   // 평점/주차/준공/매매
//   listingStars: number;
//   parkingType: string;
//   parkingCount: string;
//   completionDate: string;
//   salePrice: string;

//   // 면적
//   baseAreaSet: AreaSet;
//   extraAreaSets: AreaSet[];
//   exclusiveArea: string;
//   realArea: string;
//   extraExclusiveAreas: string[];
//   extraRealAreas: string[];
//   baseAreaTitleOut: string;
//   extraAreaTitlesOut: string[];

//   // 등기/등급
//   elevator: "O" | "X";
//   registryOne?: Registry;
//   slopeGrade?: Grade;
//   structureGrade?: Grade;

//   // 숫자
//   totalBuildings: string;
//   totalFloors: string;
//   totalHouseholds: string;
//   remainingHouseholds: string;

//   // 옵션/메모
//   options: string[];
//   etcChecked: boolean;
//   optionEtc: string;
//   publicMemo: string;
//   secretMemo: string;

//   // 향/유닛
//   orientations: ReturnType<
//     typeof import("@/features/properties/lib/orientation").buildOrientationFields
//   >["orientations"];
//   aspect: string;
//   aspectNo: number;
//   aspect1?: string;
//   aspect2?: string;
//   aspect3?: string;
//   unitLines: UnitLine[];

//   // 이미지
//   imageFolders: ImageItem[][];
//   verticalImages: ImageItem[];

//   // 기타
//   pinKind: PinKind;
// };

// export function buildEditPayload(a: BuildEditArgs) {
//   // UI용 카드 이미지: url 있는 항목만
//   const imageCardsUI = a.imageFolders.map((card) =>
//     card
//       .filter((it) => !!it.url)
//       .map(({ url, name, caption }) => ({
//         url: url as string,
//         name: name ?? "",
//         ...(caption ? { caption } : {}),
//       }))
//   );

//   // 저장용 카드 이미지: idbKey/url 모두 존중
//   const imageFoldersStored = a.imageFolders.map((card) =>
//     card.map(({ idbKey, url, name, caption }) => ({
//       ...(idbKey ? { idbKey } : {}),
//       ...(url ? { url } : {}),
//       ...(name ? { name } : {}),
//       ...(caption ? { caption } : {}),
//     }))
//   );

//   // 평면 문자열 배열 (레거시 UI용)
//   const imagesFlatStrings: string[] = a.imageFolders
//     .flat()
//     .map((f) => f.url)
//     .filter((u): u is string => typeof u === "string" && u.length > 0);

//   // 카드별 개수는 실제 UI 배열 기준으로
//   const imageCardCounts = imageCardsUI.map((card) => card.length);

//   // 저장용 세로형(첨부) 이미지
//   const verticalImagesStored = a.verticalImages.map((f) =>
//     f.idbKey
//       ? {
//           idbKey: f.idbKey,
//           ...(f.name ? { name: f.name } : {}),
//           ...(f.caption ? { caption: f.caption } : {}),
//         }
//       : {
//           ...(f.url ? { url: f.url } : {}),
//           ...(f.name ? { name: f.name } : {}),
//           ...(f.caption ? { caption: f.caption } : {}),
//         }
//   );

//   // UI용 세로형: url 있는 항목만
//   const verticalImagesUI = a.verticalImages
//     .filter((f) => !!f.url)
//     .map((f) => ({
//       url: f.url as string,
//       name: f.name ?? "",
//       ...(f.caption ? { caption: f.caption } : {}),
//       ...(f.idbKey ? { idbKey: f.idbKey } : {}),
//     }));

//   const payload = {
//     id: a.id,

//     // 기본
//     listingStars: a.listingStars,
//     title: a.title,
//     address: a.address,
//     officeName: a.officeName,
//     officePhone: a.officePhone,
//     officePhone2: a.officePhone2,
//     moveIn: a.moveIn,
//     floor: a.floor,
//     roomNo: a.roomNo,
//     structure: a.structure,

//     // 향/방향
//     aspect: a.aspect,
//     aspectNo: a.aspectNo,
//     ...(a.aspect1 ? { aspect1: a.aspect1 } : {}),
//     ...(a.aspect2 ? { aspect2: a.aspect2 } : {}),
//     ...(a.aspect3 ? { aspect3: a.aspect3 } : {}),
//     orientations: a.orientations,

//     // 가격/주차/준공
//     salePrice: a.salePrice,
//     parkingType: a.parkingType,
//     parkingCount: a.parkingCount,
//     completionDate: a.completionDate,

//     // 면적/엘리베이터/통계
//     exclusiveArea: a.exclusiveArea,
//     realArea: a.realArea,
//     elevator: a.elevator,
//     totalBuildings: a.totalBuildings,
//     totalFloors: a.totalFloors,
//     totalHouseholds: a.totalHouseholds,
//     remainingHouseholds: a.remainingHouseholds,

//     // 등급/등기/옵션/메모
//     slopeGrade: a.slopeGrade,
//     structureGrade: a.structureGrade,
//     options: a.options,
//     optionEtc: a.etcChecked ? a.optionEtc.trim() : "",
//     publicMemo: a.publicMemo,
//     secretMemo: a.secretMemo,
//     registry: a.registryOne,

//     // 유닛
//     unitLines: a.unitLines,

//     // 이미지 관련
//     imageFolders: imageFoldersStored, // 저장용(2D)
//     imagesByCard: imageCardsUI, // 레거시 UI 호환(2D)
//     imageCards: imageCardsUI, // 레거시 UI 호환(2D)
//     imageCardCounts,
//     verticalImages: verticalImagesStored, // 저장용(1D)
//     fileItems: verticalImagesUI, // 레거시 UI(1D)
//     images: imagesFlatStrings, // 레거시 UI(1D)

//     // 추가 면적
//     extraExclusiveAreas: a.extraExclusiveAreas,
//     extraRealAreas: a.extraRealAreas,

//     // 면적 타이틀(호환 키 포함)
//     baseAreaTitle: a.baseAreaTitleOut,
//     areaTitle: a.baseAreaTitleOut,
//     areaSetTitle: a.baseAreaTitleOut,
//     extraAreaTitles: a.extraAreaTitlesOut,
//     areaSetTitles: a.extraAreaTitlesOut,

//     // 핀 종류(호환 키 포함)
//     pinKind: a.pinKind,
//     kind: a.pinKind,
//     markerKind: a.pinKind,
//   } satisfies Record<string, unknown>;

//   return payload as unknown as CreatePayload;
// }
