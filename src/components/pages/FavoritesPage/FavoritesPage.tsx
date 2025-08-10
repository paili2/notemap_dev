// 저장된 매물만 필터링
// Header + PropertyList + 즐겨찾기 아이콘(토글)
"use client";

import * as React from "react";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/molecules/Pagination/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import { Separator } from "@/components/atoms/Separator/Separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/Tabs/Tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/Tooltip";
import { cn } from "@/lib/utils";
import {
  Grid2X2,
  List,
  Filter,
  Star,
  Trash2,
  MoreHorizontal,
  MapPin,
  CalendarDays,
  Image as ImageIcon,
  Search,
} from "lucide-react";

export type FavoriteItem = {
  id: string;
  title: string;
  address?: string;
  thumbUrl?: string;
  tags?: string[];
  updatedAt?: string; // ISO
  type?: "pin" | "collection";
  noteCount?: number;
};

const MOCK: FavoriteItem[] = [
  {
    id: "p-001",
    title: "성수동 루프탑 스팟",
    address: "서울 성동구 연무장길 31",
    thumbUrl: "https://picsum.photos/seed/notemap1/640/360",
    tags: ["카페", "전망"],
    updatedAt: "2025-08-08T10:21:00+09:00",
    type: "pin",
    noteCount: 3,
  },
  {
    id: "p-002",
    title: "을지로 야시장",
    address: "서울 중구 을지로",
    thumbUrl: "https://picsum.photos/seed/notemap2/640/360",
    tags: ["노상", "야식"],
    updatedAt: "2025-08-05T20:01:00+09:00",
    type: "pin",
    noteCount: 1,
  },
  {
    id: "c-101",
    title: "도쿄 먹킷리스트",
    thumbUrl: "https://picsum.photos/seed/notemap3/640/360",
    tags: ["일본", "여행"],
    updatedAt: "2025-08-01T09:00:00+09:00",
    type: "collection",
    noteCount: 12,
  },
  {
    id: "p-003",
    title: "부산 감천 문화마을 뷰포인트",
    address: "부산 사하구 감내2로",
    thumbUrl: "https://picsum.photos/seed/notemap4/640/360",
    tags: ["뷰", "포토스팟"],
    updatedAt: "2025-07-30T15:33:00+09:00",
    type: "pin",
    noteCount: 2,
  },
];

function useFavorites() {
  const [items, setItems] = React.useState<FavoriteItem[]>(MOCK);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [sort, setSort] = React.useState<"recent" | "title">("recent");
  const [onlyPins, setOnlyPins] = React.useState(false);
  const [onlyCollections, setOnlyCollections] = React.useState(false);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const filtered = React.useMemo(() => {
    let arr = items.filter((it) =>
      [it.title, it.address, ...(it.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
    if (onlyPins) arr = arr.filter((it) => it.type === "pin");
    if (onlyCollections) arr = arr.filter((it) => it.type === "collection");
    if (sort === "recent") {
      arr = arr.sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() -
          new Date(a.updatedAt ?? 0).getTime()
      );
    } else if (sort === "title") {
      arr = arr.sort((a, b) => (a.title > b.title ? 1 : -1));
    }
    return arr;
  }, [items, query, sort, onlyPins, onlyCollections]);

  const allChecked =
    filtered.length > 0 && filtered.every((it) => selected[it.id]);
  const indeterminate = !allChecked && Object.values(selected).some(Boolean);

  const toggleAll = (checked: boolean) => {
    const next = { ...selected };
    filtered.forEach((it) => (next[it.id] = checked));
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) =>
    setSelected((prev) => ({ ...prev, [id]: checked }));

  const removeSelected = () => {
    const keep = items.filter((it) => !selected[it.id]);
    setItems(keep);
    setSelected({});
  };

  return {
    items: filtered,
    query,
    setQuery,
    view,
    setView,
    sort,
    setSort,
    onlyPins,
    setOnlyPins,
    onlyCollections,
    setOnlyCollections,
    selected,
    toggleAll,
    toggleOne,
    removeSelected,
    allChecked,
    indeterminate,
  };
}

export default function FavoritesPage() {
  const f = useFavorites();

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">즐겨찾기</h1>
          <p className="text-sm text-muted-foreground">
            NoteMap에서 저장한 핀과 컬렉션을 한 곳에서 관리하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="gap-2">
            <Star className="h-4 w-4" /> 새 컬렉션
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MoreHorizontal className="h-4 w-4" /> 더보기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>일괄 작업</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={f.removeSelected} className="gap-2">
                <Trash2 className="h-4 w-4" /> 선택 제거
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  value={f.query}
                  onChange={(e) => f.setQuery(e.target.value)}
                  placeholder="제목, 태그, 주소로 검색"
                  className="pl-8"
                />
              </div>

              <Separator
                orientation="vertical"
                className="hidden h-8 md:block"
              />

              <Tabs defaultValue="all" className="hidden md:block">
                <TabsList>
                  <TabsTrigger
                    value="all"
                    onClick={() => {
                      f.setOnlyPins(false);
                      f.setOnlyCollections(false);
                    }}
                  >
                    전체
                  </TabsTrigger>
                  <TabsTrigger
                    value="pin"
                    onClick={() => {
                      f.setOnlyPins(true);
                      f.setOnlyCollections(false);
                    }}
                  >
                    핀
                  </TabsTrigger>
                  <TabsTrigger
                    value="collection"
                    onClick={() => {
                      f.setOnlyPins(false);
                      f.setOnlyCollections(true);
                    }}
                  >
                    컬렉션
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
                <Select value={f.sort} onValueChange={(v: any) => f.setSort(v)}>
                  <SelectTrigger id="sort" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">최근 업데이트</SelectItem>
                    <SelectItem value="title">제목 (A→Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={f.view === "grid" ? "default" : "outline"}
                      size="icon"
                      aria-label="그리드 보기"
                      onClick={() => f.setView("grid")}
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>그리드 보기</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={f.view === "list" ? "default" : "outline"}
                      size="icon"
                      aria-label="리스트 보기"
                      onClick={() => f.setView("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>리스트 보기</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 컨텐츠 */}
      {f.items.length === 0 ? (
        <EmptyState onReset={() => window.location.reload()} />
      ) : f.view === "grid" ? (
        <GridView
          items={f.items}
          allChecked={f.allChecked}
          indeterminate={f.indeterminate}
          onToggleAll={f.toggleAll}
          onToggleOne={f.toggleOne}
        />
      ) : (
        <ListView
          items={f.items}
          allChecked={f.allChecked}
          indeterminate={f.indeterminate}
          onToggleAll={f.toggleAll}
          onToggleOne={f.toggleOne}
        />
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
    </div>
  );
}

/* ------------------------- Sub Components ------------------------- */

function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" /> 즐겨찾기가 비어있어요
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        NoteMap에서 마음에 드는 핀을 저장해보세요. 컬렉션으로 묶어두면 관리가 더
        쉬워요.
      </CardContent>
      <CardFooter>
        <Button onClick={onReset} variant="secondary">
          예시 불러오기
        </Button>
      </CardFooter>
    </Card>
  );
}

function GridView({
  items,
  allChecked,
  indeterminate,
  onToggleAll,
  onToggleOne,
}: {
  items: FavoriteItem[];
  allChecked: boolean;
  indeterminate: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: string, checked: boolean) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Checkbox
          checked={allChecked}
          // @ts-ignore
          indeterminate={indeterminate}
          onCheckedChange={(v: boolean) => onToggleAll(!!v)}
          aria-label="전체 선택"
        />
        <span className="text-sm text-muted-foreground">전체 선택</span>
      </div>

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
                {it.type === "pin" ? (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" /> 핀
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" /> 컬렉션
                  </Badge>
                )}
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-1 text-base">
                  {it.title}
                </CardTitle>
                <Checkbox
                  checked={false}
                  onCheckedChange={(v: boolean) => onToggleOne(it.id, !!v)}
                  aria-label={`${it.title} 선택`}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {it.address && <p className="line-clamp-1">{it.address}</p>}
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
              <Button size="sm" variant="outline">
                자세히
              </Button>
              <Button size="sm">열기</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ListView({
  items,
  allChecked,
  indeterminate,
  onToggleAll,
  onToggleOne,
}: {
  items: FavoriteItem[];
  allChecked: boolean;
  indeterminate: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: string, checked: boolean) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b p-3">
          <Checkbox
            checked={allChecked}
            // @ts-ignore
            indeterminate={indeterminate}
            onCheckedChange={(v: boolean) => onToggleAll(!!v)}
            aria-label="전체 선택"
          />
          <span className="text-sm text-muted-foreground">전체 선택</span>
        </div>
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
                    {it.type === "pin" ? (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" /> 핀
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" /> 컬렉션
                      </Badge>
                    )}
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

              <div className="hidden items-center gap-2 sm:flex">
                <Badge variant="outline" className="gap-1 text-xs">
                  노트 {it.noteCount ?? 0}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />{" "}
                  {formatDate(it.updatedAt)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  자세히
                </Button>
                <Button size="sm">열기</Button>
                <Checkbox
                  onCheckedChange={(v: boolean) => onToggleOne(it.id, !!v)}
                  aria-label={`${it.title} 선택`}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
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
