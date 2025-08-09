// 고객 목록 + 상세 패널
import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import { ScrollArea } from "@/components/atoms/ScrollArea/ScrollArea";
import { cn } from "@/lib/utils";
import {
  StarIcon,
  StarOffIcon,
  UserPlus2Icon,
  Trash2Icon,
  SearchIcon,
  TagIcon,
  PhoneIcon,
} from "lucide-react";

type CustomerType = "buyer" | "tenant" | "seller" | "landlord";
type CustomerStatus = "lead" | "active" | "inactive";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  type: CustomerType;
  status: CustomerStatus;
  tags: string[];
  favorite?: boolean;
  note?: string;
  // 관계: 담당 매물/핀 ID 배열 같은 필드도 추후 확장 가능
}

const typeLabel: Record<CustomerType, string> = {
  buyer: "매수의뢰",
  tenant: "임차의뢰",
  seller: "매도고객",
  landlord: "임대인",
};

const statusColors: Record<CustomerStatus, string> = {
  lead: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-200 text-gray-700",
};

function formatPhone(v?: string) {
  if (!v) return "";
  const digits = v.replace(/\D/g, "");
  if (digits.startsWith("02")) {
    // 서울 지역번호
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 2)}-${digits.slice(
        2,
        digits.length - 4
      )}-${digits.slice(-4)}`;
  } else {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(
      3,
      digits.length - 4
    )}-${digits.slice(-4)}`;
  }
  return v;
}

export function CustomerSection() {
  // 샘플 데이터
  const [customers, setCustomers] = React.useState<Customer[]>([
    {
      id: crypto.randomUUID(),
      name: "김지훈",
      phone: "01012345678",
      type: "buyer",
      status: "active",
      tags: ["오피스텔", "중층", "역세권"],
      favorite: true,
      note: "8월 말 계약 목표",
    },
    {
      id: crypto.randomUUID(),
      name: "이서연",
      phone: "01087654321",
      type: "tenant",
      status: "lead",
      tags: ["반려동물", "1.5룸"],
      favorite: false,
    },
    {
      id: crypto.randomUUID(),
      name: "박민수",
      phone: "01055557777",
      type: "landlord",
      status: "inactive",
      tags: ["상가"],
      favorite: false,
    },
  ]);

  // 검색/필터
  const [q, setQ] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"" | CustomerStatus>(
    ""
  );
  const [filterType, setFilterType] = React.useState<"" | CustomerType>("");

  // 폼 상태
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [type, setType] = React.useState<CustomerType>("buyer");
  const [status, setStatus] = React.useState<CustomerStatus>("lead");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [note, setNote] = React.useState("");

  const resetForm = () => {
    setName("");
    setPhone("");
    setType("buyer");
    setStatus("lead");
    setTags([]);
    setTagInput("");
    setNote("");
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const onTagKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  const createCustomer: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newItem: Customer = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      type,
      status,
      tags,
      favorite: false,
      note: note.trim(),
    };
    setCustomers((prev) => [newItem, ...prev]);
    resetForm();
  };

  const toggleFavorite = (id: string) =>
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c))
    );

  const removeCustomer = (id: string) =>
    setCustomers((prev) => prev.filter((c) => c.id !== id));

  const filtered = customers.filter((c) => {
    const hitQ =
      !q ||
      c.name.includes(q) ||
      c.phone?.includes(q) ||
      c.tags.some((t) => t.includes(q));
    const hitStatus = !filterStatus || c.status === filterStatus;
    const hitType = !filterType || c.type === filterType;
    return hitQ && hitStatus && hitType;
  });

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>👥 고객 관리</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* 검색/필터 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름/연락처/태그 검색"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQ(e.target.value)
              }
            />
          </div>
          <select
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CustomerType | "")}
          >
            <option value="">유형 전체</option>
            <option value="buyer">매수의뢰</option>
            <option value="tenant">임차의뢰</option>
            <option value="seller">매도고객</option>
            <option value="landlord">임대인</option>
          </select>
          <select
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as CustomerStatus | "")
            }
          >
            <option value="">상태 전체</option>
            <option value="lead">리드</option>
            <option value="active">진행</option>
            <option value="inactive">중지</option>
          </select>
        </div>

        {/* 신규 등록 FormGroup */}
        <form
          onSubmit={createCustomer}
          className="space-y-4 rounded-md border p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium">이름 *</label>
              <Input
                placeholder="예) 김지훈"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">연락처</label>
              <Input
                inputMode="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhone(e.target.value)
                }
              />
              {phone && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <PhoneIcon className="h-3.5 w-3.5" />
                  표시: {formatPhone(phone)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">유형</label>
              <select
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                value={type}
                onChange={(e) => setType(e.target.value as CustomerType)}
              >
                <option value="buyer">매수의뢰</option>
                <option value="tenant">임차의뢰</option>
                <option value="seller">매도고객</option>
                <option value="landlord">임대인</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">상태</label>
              <select
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
              >
                <option value="lead">리드</option>
                <option value="active">진행</option>
                <option value="inactive">중지</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">메모</label>
              <Input
                placeholder="요청 사항/예산/우선순위 등"
                value={note}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNote(e.target.value)
                }
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-sm font-medium flex items-center gap-1">
                <TagIcon className="h-4 w-4" /> 태그
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <Badge key={t} className="bg-blue-100 text-blue-800">
                    {t}
                    <button
                      type="button"
                      className="ml-1 opacity-70 hover:opacity-100"
                      onClick={() => removeTag(t)}
                      aria-label={`${t} 태그 삭제`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="엔터나 , 로 추가"
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTagInput(e.target.value)
                  }
                  onKeyDown={onTagKeyDown}
                  className="w-52"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  size="sm"
                >
                  추가
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              초기화
            </Button>
            <Button type="submit">
              <UserPlus2Icon className="mr-2 h-4 w-4" />
              고객 등록
            </Button>
          </div>
        </form>

        {/* 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">고객 목록</h3>
            <span className="text-sm text-muted-foreground">
              총 {filtered.length}명
            </span>
          </div>

          <ScrollArea className="h-[360px]">
            <div className="space-y-3 pr-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{c.name}</p>
                        <Badge className={statusColors[c.status]}>
                          {c.status}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          {typeLabel[c.type]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {c.phone ? formatPhone(c.phone) : "연락처 없음"}
                      </div>
                      {c.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <Badge key={t} className="bg-sky-100 text-sky-800">
                              #{t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {c.note && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          메모: {c.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={c.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                        onClick={() => toggleFavorite(c.id)}
                        className={cn(c.favorite && "text-yellow-600")}
                      >
                        {c.favorite ? (
                          <StarIcon className="h-5 w-5" />
                        ) : (
                          <StarOffIcon className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="삭제"
                        onClick={() => removeCustomer(c.id)}
                      >
                        <Trash2Icon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                  조건에 맞는 고객이 없습니다.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
