// 매물 상세정보 (사진, 설명, 지도)
"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/atoms/Card/Card";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Separator } from "@/components/atoms/Separator/Separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/Tabs/Tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/atoms/Tooltip/Tooltip";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { cn } from "@/lib/utils";
import {
  MapPin,
  CalendarDays,
  Heart,
  Share2,
  Pencil,
  Image as ImageIcon,
  Info,
} from "lucide-react";

export type PropertyPhoto = {
  id: string;
  url: string;
  alt?: string;
};

export type PropertyLocation = {
  lat: number;
  lng: number;
  address?: string;
};

export type PropertyDetail = {
  id: string;
  title: string;
  status?: "공개" | "비공개" | "임시";
  type?: "아파트" | "오피스텔" | "상가" | "기타";
  priceText?: string; // 예: "전세 4.2억" / "월세 100/50"
  updatedAt?: string; // ISO
  tags?: string[];
  description?: string;
  photos?: PropertyPhoto[];
  location?: PropertyLocation;
  noteCount?: number;
  isFavorite?: boolean;
};

type PropertyDetailPageProps = {
  data: PropertyDetail;
  className?: string;
  /** 커스텀 지도 영역을 주입하고 싶으면 사용 (예: <MapView .../>) */
  mapSlot?: React.ReactNode;
  onToggleFavorite?: (id: string, next: boolean) => void;
  onShare?: (id: string) => void;
  onEdit?: (id: string) => void;
};

export default function PropertyDetailPage({
  data,
  className,
  mapSlot,
  onToggleFavorite,
  onShare,
  onEdit,
}: PropertyDetailPageProps) {
  const [fav, setFav] = React.useState<boolean>(!!data.isFavorite);

  const toggleFav = () => {
    const next = !fav;
    setFav(next);
    onToggleFavorite?.(data.id, next);
  };

  return (
    <main className={cn("mx-auto max-w-7xl p-6", className)}>
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {data.type && <Badge variant="secondary">{data.type}</Badge>}
            {data.status && <Badge variant="outline">{data.status}</Badge>}
            {data.priceText && (
              <span className="inline-flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> {data.priceText}
              </span>
            )}
            {data.updatedAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                업데이트: {formatDate(data.updatedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={fav ? "default" : "outline"}
                  onClick={toggleFav}
                  aria-pressed={fav}
                  className="gap-2"
                >
                  <Heart className={cn("h-4 w-4", fav && "fill-current")} />
                  {fav ? "즐겨찾기됨" : "즐겨찾기"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>이 매물을 즐겨찾기에 추가/해제</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => onShare?.(data.id)}
          >
            <Share2 className="h-4 w-4" /> 공유
          </Button>
          <Button className="gap-2" onClick={() => onEdit?.(data.id)}>
            <Pencil className="h-4 w-4" /> 편집
          </Button>
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* 좌: 사진/설명/지도 */}
        <div className="space-y-6">
          {/* 사진 갤러리 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>사진</CardTitle>
              <CardDescription>현장 사진 및 참고 이미지</CardDescription>
            </CardHeader>
            <CardContent>
              {data.photos && data.photos.length > 0 ? (
                <Gallery photos={data.photos} />
              ) : (
                <div className="aspect-video grid place-items-center rounded-md bg-muted text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <span>등록된 사진이 없습니다</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 설명 + 태그 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>설명</CardTitle>
              <CardDescription>상세 내용 및 메모</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {data.description || "설명이 아직 없어요."}
              </p>

              {data.tags && data.tags.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((t) => (
                      <Badge key={t} variant="outline">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 지도 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>지도</CardTitle>
              <CardDescription>위치 정보</CardDescription>
            </CardHeader>
            <CardContent>
              {mapSlot ? (
                <div className="overflow-hidden rounded-md">{mapSlot}</div>
              ) : (
                <MapPlaceholder location={data.location} />
              )}

              {/* 주소 표기 */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{data.location?.address || "주소 정보 없음"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 우: 요약/속성/노트 */}
        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>요약</CardTitle>
              <CardDescription>핵심 정보</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="유형" value={data.type || "-"} />
              <Row label="상태" value={data.status || "-"} />
              <Row label="가격" value={data.priceText || "-"} />
              <Row label="노트 수" value={String(data.noteCount ?? 0)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>보기 옵션</CardTitle>
              <CardDescription>개인화 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox id="show-nearby" /> <span>주변 편의시설 보기</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox id="show-traffic" /> <span>교통 정보 표시</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox id="show-roadview" /> <span>로드뷰 표시</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>탭</CardTitle>
              <CardDescription>부가 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="notes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notes">노트</TabsTrigger>
                  <TabsTrigger value="activity">활동</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="notes"
                  className="text-sm text-muted-foreground"
                >
                  연결된 노트가 없습니다.
                </TabsContent>
                <TabsContent
                  value="activity"
                  className="text-sm text-muted-foreground"
                >
                  최근 활동 내역이 없습니다.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Gallery({ photos }: { photos: PropertyPhoto[] }) {
  // 간단 썸네일 그리드 + 첫 이미지 강조
  const [active, setActive] = React.useState(photos[0]?.id);
  const current = photos.find((p) => p.id === active) || photos[0];

  return (
    <div className="space-y-3">
      {/* 메인 뷰 */}
      <div className="aspect-video overflow-hidden rounded-md bg-muted">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt || "대표 이미지"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* 썸네일 */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-md border",
                active === p.id
                  ? "ring-2 ring-primary"
                  : "hover:border-foreground/20"
              )}
              aria-label={`사진 선택: ${p.alt || p.id}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.alt || ""}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MapPlaceholder({ location }: { location?: PropertyLocation }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <MapPin className="mr-2 h-5 w-5" />
        <span>
          {location
            ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
            : "위치 정보 없음"}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
