"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Heart,
  HeartOff,
} from "lucide-react";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { Badge } from "@/components/atoms/Badge/Badge";

import type { LatLng, MapMarker } from "@/features/properties/types/map";
import MapView from "../components/MapView";

export type PropertyItem = {
  id: string;
  title: string;
  priceText?: string;
  status?: "공개" | "비공개" | "계약중" | "거래완료";
  type?: "아파트" | "오피스텔" | "상가" | "사무실" | "토지" | string;
  address?: string;
  position: LatLng;
  tags?: string[];
  favorite?: boolean;
  updatedAt?: string;
};

const MOCK: PropertyItem[] = [
  {
    id: "p-101",
    title: "성수동 리버뷰 84A",
    priceText: "전세 4.2억",
    status: "공개",
    type: "아파트",
    address: "서울 성동구 성수동1가",
    position: { lat: 37.5446, lng: 127.0559 },
    tags: ["리버뷰", "역세권"],
    updatedAt: "2025-08-10",
  },
  {
    id: "p-102",
    title: "연남동 테라스 오피스텔",
    priceText: "월세 1,200/95",
    status: "공개",
    type: "오피스텔",
    address: "서울 마포구 연남동",
    position: { lat: 37.561, lng: 126.925 },
    tags: ["풀옵션", "테라스"],
    updatedAt: "2025-08-09",
  },
  {
    id: "p-103",
    title: "삼성역 역세권 상가 1층",
    priceText: "권리 2.5억 / 보증금 5천 / 월 450",
    status: "계약중",
    type: "상가",
    address: "서울 강남구 삼성동",
    position: { lat: 37.5089, lng: 127.063 },
    tags: ["1층", "상권핵심"],
    updatedAt: "2025-08-06",
  },
];

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "YOUR_KEY";

const MapHomePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<PropertyItem[]>(MOCK);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const q = query.trim();
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        (p.address?.toLowerCase().includes(q.toLowerCase()) ?? false);
      const matchType = type === "all" || p.type === type;
      const matchStatus = status === "all" || p.status === status;
      return matchQ && matchType && matchStatus;
    });
  }, [items, query, type, status]);

  const markers: MapMarker[] = useMemo(
    () =>
      filtered.map((p) => ({
        id: p.id,
        title: p.title,
        position: p.position,
      })),
    [filtered]
  );

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );

  const center: LatLng | undefined = selected ? selected.position : undefined;

  const toggleFavorite = (id: string) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
  };

  return (
    <div className="fixed inset-0 grid w-full grid-cols-1 md:grid-cols-[380px_1fr]">
      <aside className="border-r bg-background">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="지역, 단지, 키워드 검색"
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" title="필터">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="아파트">아파트</SelectItem>
              <SelectItem value="오피스텔">오피스텔</SelectItem>
              <SelectItem value="상가">상가</SelectItem>
              <SelectItem value="사무실">사무실</SelectItem>
              <SelectItem value="토지">토지</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="공개">공개</SelectItem>
              <SelectItem value="계약중">계약중</SelectItem>
              <SelectItem value="거래완료">거래완료</SelectItem>
              <SelectItem value="비공개">비공개</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto h-[calc(100%-136px)] p-3 space-y-2">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                조건에 맞는 매물이 없습니다.
              </CardContent>
            </Card>
          )}

          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-shadow ${
                selectedId === p.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedId(p.id)}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {p.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-2">
                <div className="text-sm text-muted-foreground">{p.address}</div>
                <div className="text-sm font-medium">
                  {p.priceText || "가격 문의"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status && <Badge variant="secondary">{p.status}</Badge>}
                  {p.type && <Badge variant="outline">{p.type}</Badge>}
                  {p.tags?.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div className="text-xs text-muted-foreground">
                    업데이트 {p.updatedAt}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.id);
                    }}
                  >
                    {p.favorite ? (
                      <Heart className="h-4 w-4" />
                    ) : (
                      <HeartOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </aside>

      <section className="relative min-h-0 overflow-hidden">
        <div className="absolute left-3 top-3 z-10">
          {selected && (
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">
                  선택됨: {selected.title}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* 지도를 부모 높이에 맞게 100% 채우기 */}
        <div className="absolute inset-0">
          <MapView
            appKey={KAKAO_MAP_KEY}
            center={center}
            level={selected ? 5 : 7}
            markers={markers}
            fitToMarkers={!selected}
            onMarkerClick={(m) => setSelectedId(m.id)}
            controls={{ zoom: true, mapType: true }}
          />
        </div>
      </section>
    </div>
  );
};

export default MapHomePage;
