"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog/Dialog";
import { useQuery } from "@tanstack/react-query";
import { getFavoriteGroups, type FavoriteGroup } from "@/features/favorites/api/favorites";
import { getPinRaw } from "@/shared/api/pins/queries/getPin";
import { FavoriteGroupList } from "./FavoriteGroupList";

interface AccountFavoritesModalProps {
  open: boolean;
  accountId: string | null;
  accountName?: string;
  onClose: () => void;
}

export function AccountFavoritesModal({
  open,
  accountId,
  accountName,
  onClose,
}: AccountFavoritesModalProps) {
  // 해당 계정의 즐겨찾기 목록 조회
  const { data: favoriteGroups, isLoading, error } = useQuery({
    queryKey: ["account-favorites", accountId],
    queryFn: () => getFavoriteGroups(true),
    enabled: open && !!accountId,
    // TODO: 관리자 권한으로 특정 accountId의 즐겨찾기를 조회하는 API 필요
    // 현재는 로그인한 사용자의 즐겨찾기만 조회 가능
  });

  // 매물 정보 조회 (pinId -> 매물 이름)
  const [pinNamesMap, setPinNamesMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!favoriteGroups || favoriteGroups.length === 0) {
      setPinNamesMap(new Map());
      return;
    }

    // 모든 pinId 수집
    const allPinIds = new Set<string>();
    favoriteGroups.forEach((group) => {
      (group.items || []).forEach((item) => {
        allPinIds.add(item.pinId);
      });
    });

    // 병렬로 핀 정보 가져오기
    const loadPinNames = async () => {
      const namesMap = new Map<string, string>();
      await Promise.all(
        Array.from(allPinIds).map(async (pinId) => {
          try {
            const pin = await getPinRaw(pinId);
            const pinName = pin.name || pin.badge || `Pin ${pinId}`;
            namesMap.set(pinId, pinName);
          } catch (error) {
            console.error(`핀 ${pinId} 정보 가져오기 실패:`, error);
            namesMap.set(pinId, `Pin ${pinId}`);
          }
        })
      );
      setPinNamesMap(namesMap);
    };

    loadPinNames();
  }, [favoriteGroups]);

  // 매물 이름이 포함된 그룹 데이터 생성
  const groupsWithPinNames = useMemo(() => {
    if (!favoriteGroups) return [];
    return favoriteGroups.map((group) => ({
      ...group,
      items: group.items?.map((item) => ({
        ...item,
        pinName: pinNamesMap.get(item.pinId) || `Pin ${item.pinId}`,
      })),
    }));
  }, [favoriteGroups, pinNamesMap]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {accountName ? `${accountName}님의 즐겨찾기` : "즐겨찾기 목록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="text-center text-gray-500 py-8">
              즐겨찾기 목록을 불러오는 중...
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-8">
              즐겨찾기 목록을 불러오는 중 오류가 발생했습니다.
            </div>
          )}

          {!isLoading && !error && (
            <>
              {!favoriteGroups || favoriteGroups.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  등록된 즐겨찾기가 없습니다.
                </div>
              ) : (
                <FavoriteGroupList groups={groupsWithPinNames} />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

