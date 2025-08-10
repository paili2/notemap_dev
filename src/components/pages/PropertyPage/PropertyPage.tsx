// 매물 전체 관리 페이지
"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Separator } from "@/components/atoms/Separator/Separator";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/atoms/Tabs/Tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/molecules/Pagination/Pagination";
import { cn } from "@/lib/utils";
import {
  Grid2X2,
  List,
  Image as ImageIcon,
  MapPin,
  CalendarDays,
  Filter,
  Search,
} from "lucide-react";

export type PropertyItem = {
  id: string;
  title: string;
  type: "아파트" | "오피스텔" | "상가" | "기타";
  address?: string;
  priceText?: string; // 예: "전세 4.2억" | "월세 100/50" | "매매 7.8억"
  updatedAt?: string; // ISO
  tags?: string[];
  thumbUrl?: string;
  isFavorite?: boolean;
};

const MOCK: PropertyItem[] = [
  {
    id: "l-001",
    title: "성수 리버뷰 84A",
    type: "아파트",
    address: "서울 성동구 성수동",
    priceText: "전세 4.2억",
    updatedAt: "2025-08-09T02:10:00+09:00",
    tags: ["리버뷰", "역세권"],
    thumbUrl: "https://picsum.photos/seed/pp11/640/360",
  },
  {
    id: "l-002",
    title: "을지로 코너 상가 1층",
    type: "상가",
    address: "서울 중구 을지로",
    priceText: "월세 500/250",
    updatedAt: "2025-08-07T15:20:00+09:00",
    tags: ["코너", "집객"],
    thumbUrl: "https://picsum.photos/seed/pp12/640/360",
  },
  {
    id: "l-003",
    title: "판교 오피스텔 27평",
    type: "오피스텔",
    address: "경기 성남시 분당구",
    priceText: "매매 7.8억",
    updatedAt: "2025-08-01T09:00:00+09:00",
    tags: ["신축", "주차"],
    thumbUrl: "https://picsum.photos/seed/pp13/640/360",
    isFavorite: true,
  },
  {
    id: "l-004",
    title: "남해 바다뷰 단독",
    type: "기타",
    address: "경남 남해군",
    priceText: "매매 12.4억",
    updatedAt: "2025-07-28T11:11:00+09:00",
    tags: ["바다뷰", "세컨하우스"],
    thumbUrl: "https://picsum.photos/seed/pp14/640/360",
  },
];

type SortKey = "recent" | "title"; // 필요하면 priceAsc/priceDesc 등으로 확장

export default function PropertyPage() {
  const [items, setItems] = React.useState<PropertyItem[]>(MOCK);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = React.useState<
    "all" | PropertyItem["type"]
  >("all");
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [onlyFavorite, setOnlyFavorite] = React.useState(false);

  const filtered = React.useMemo(() => {
    let arr = items.filter((it) =>
      [it.title, it.address, it.priceText, ...(it.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
    if (typeFilter !== "all") arr = arr.filter((it) => it.type === typeFilter);
    if (onlyFavorite) arr = arr.filter((it) => it.isFavorite);

    if (sort === "recent") {
      arr = arr
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? 0).getTime() -
            new Date(a.updatedAt ?? 0).getTime()
        );
    } else if (sort === "title") {
      arr = arr.slice().sort((a, b) => (a.title > b.title ? 1 : -1));
    }
    return arr;
  }, [items, query, typeFilter, sort, onlyFavorite]);

  return (
    <main className="mx-auto max-w-7xl p-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매물 목록</h1>
          <p className="text-sm text-muted-foreground">
            NoteMap에 등록된 매물을 검색/필터링하고 살펴보세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>새 매물 등록</Button>
          <Button variant="outline">가져오기</Button>
        </div>
      </div>

      {/* 툴바 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                <Input
                  placeholder="제목, 태그, 주소로 검색"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <Separator
                orientation="vertical"
                className="hidden h-8 md:block"
              />

              <Tabs
                defaultValue="all"
                value={typeFilter === "all" ? "all" : typeFilter}
                className="hidden md:block"
              >
                <TabsList>
                  <TabsTrigger value="all" onClick={() => setTypeFilter("all")}>
                    전체
                  </TabsTrigger>
                  <TabsTrigger
                    value="아파트"
                    onClick={() => setTypeFilter("아파트")}
                  >
                    아파트
                  </TabsTrigger>
                  <TabsTrigger
                    value="오피스텔"
                    onClick={() => setTypeFilter("오피스텔")}
                  >
                    오피스텔
                  </TabsTrigger>
                  <TabsTrigger
                    value="상가"
                    onClick={() => setTypeFilter("상가")}
                  >
                    상가
                  </TabsTrigger>
                  <TabsTrigger
                    value="기타"
                    onClick={() => setTypeFilter("기타")}
                  >
                    기타
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Separator
                orientation="vertical"
                className="hidden h-8 md:block"
              />

              <div className="hidden items-center gap-2 md:flex">
                <Label htmlFor="sort" className="text-sm text-muted-foreground">
                  정렬
                </Label>
                <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
                  <SelectTrigger id="sort" className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">최근 업데이트</SelectItem>
                    <SelectItem value="title">제목 (A→Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={onlyFavorite}
                  onCheckedChange={(v) => setOnlyFavorite(Boolean(v))}
                />
                즐겨찾기만
              </label>
              <div className="flex items-center gap-1">
                <Button
                  variant={view === "grid" ? "default" : "outline"}
                  size="icon"
                  aria-label="그리드 보기"
                  onClick={() => setView("grid")}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "list" ? "default" : "outline"}
                  size="icon"
                  aria-label="리스트 보기"
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 컨텐츠 */}
      {filtered.length === 0 ? (
        <EmptyState onReset={() => setItems(MOCK)} />
      ) : view === "grid" ? (
        <GridView items={filtered} />
      ) : (
        <ListView items={filtered} />
      )}

      {/* 페이지네이션 (모의) */}
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 py-2 text-sm text-muted-foreground">
                1 / 1
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </main>
  );
}

/* ---------------- Sub Components ---------------- */

function GridView({ items }: { items: PropertyItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Card key={it.id} className="overflow-hidden">
          <div className="relative aspect-video w-full bg-muted">
            {it.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={it.thumbUrl}
                alt={it.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <div className="absolute left-2 top-2 flex items-center gap-2">
              <Badge variant="secondary">{it.type}</Badge>
            </div>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="line-clamp-1 text-base">{it.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{it.address || "-"}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-1">
              {(it.tags ?? []).map((t) => (
                <Badge key={t} variant="outline" className="font-normal">
                  #{t}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>업데이트: {formatDate(it.updatedAt)}</span>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="text-sm font-medium">{it.priceText || "-"}</div>
            <Button size="sm">자세히</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function ListView({ items }: { items: PropertyItem[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {it.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.thumbUrl}
                      alt={it.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{it.type}</Badge>
                    <p className="truncate font-medium">{it.title}</p>
                  </div>
                  {it.address && (
                    <p className="truncate text-sm text-muted-foreground">
                      {it.address}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(it.tags ?? []).map((t) => (
                      <Badge key={t} variant="outline" className="font-normal">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{formatDate(it.updatedAt)}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {it.priceText || "-"}
                </span>
                <Button size="sm">자세히</Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" /> 조건에 맞는 매물이 없어요
        </CardTitle>
        <CardDescription>검색어나 필터를 조정해보세요.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        예시 데이터를 다시 불러올 수도 있어요.
      </CardContent>
      <CardFooter>
        <Button variant="secondary" onClick={onReset}>
          예시 불러오기
        </Button>
      </CardFooter>
    </Card>
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
