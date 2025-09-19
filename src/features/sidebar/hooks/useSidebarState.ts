import { useState } from "react";
import type { FavorateListItem, ListItem } from "../types/sidebar";

export function useSidebarState() {
  const [nestedFavorites, setNestedFavorites] = useState<FavorateListItem[]>([
    {
      id: "fav1",
      title: "7342",
      subItems: [
        { id: "sub1-1", title: "서울특별시 강남구 테헤란로 123" },
        { id: "sub1-2", title: "부산광역시 해운대구 해운대해변로 264" },
      ],
    },
    {
      id: "fav2",
      title: "9158",
      subItems: [
        { id: "sub2-1", title: "제주특별자치도 제주시 첨단로 242" },
        { id: "sub2-2", title: "경기도 성남시 분당구 판교역로 166" },
      ],
    },
  ]);

  const [explorations, setExplorations] = useState<ListItem[]>([
    { id: "4", title: "경상북도 경주시 첨성로 169" },
    { id: "5", title: "강원특별자치도 강릉시 창해로 17" },
    { id: "6", title: "전라북도 전주시 완산구 기린대로 99" },
    { id: "7", title: "강원특별자치도 속초시 설악산로 1091" },
  ]);

  const [siteReservations, setSiteReservations] = useState<ListItem[]>([
    { id: "res1", title: "서울특별시 강남구 테헤란로 123 - 2024.01.15" },
    { id: "res2", title: "부산광역시 해운대구 해운대해변로 264 - 2024.01.20" },
    { id: "res3", title: "제주특별자치도 제주시 첨단로 242 - 2024.01.25" },
  ]);

  const handleDeleteNestedFavorite = (id: string) => {
    setNestedFavorites(nestedFavorites.filter((item) => item.id !== id));
  };

  const handleDeleteSubFavorite = (parentId: string, subId: string) => {
    setNestedFavorites(
      nestedFavorites.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subItems: item.subItems.filter((sub) => sub.id !== subId),
            }
          : item
      )
    );
  };

  const handleDeleteExploration = (id: string) => {
    setExplorations(explorations.filter((item) => item.id !== id));
  };

  const handleDeleteSiteReservation = (id: string) => {
    setSiteReservations(siteReservations.filter((item) => item.id !== id));
  };

  const handleContractRecordsClick = () => {
    console.log("영업자 계약기록 버튼 클릭됨");
  };

  return {
    nestedFavorites,
    setNestedFavorites,
    explorations,
    setExplorations,
    siteReservations,
    setSiteReservations,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    handleDeleteExploration,
    handleDeleteSiteReservation,
    handleContractRecordsClick,
  };
}
