"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import type { PersonInfo } from "../types/contract-records";

interface PersonalInfoSectionProps {
  customerInfo: PersonInfo;
  salesPerson: PersonInfo;
  onCustomerInfoChange: (info: PersonInfo) => void;
  onSalesPersonChange: (info: PersonInfo) => void;
}

// 담당자 목록 (실제로는 API에서 가져올 데이터)
const STAFF_LIST = [
  { id: "1", name: "김영업" },
  { id: "2", name: "이영업" },
  { id: "3", name: "박영업" },
  { id: "4", name: "최영업" },
  { id: "5", name: "정영업" },
];

export function PersonalInfoSection({
  customerInfo,
  salesPerson,
  onCustomerInfoChange,
  onSalesPersonChange,
}: PersonalInfoSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {/* 고객 정보 카드 */}
      <Card className="flex-shrink-0 md:col-span-2">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-sm">고객정보</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="customer-name"
                className="text-xs text-muted-foreground"
              >
                성함
              </Label>
              <Input
                id="customer-name"
                value={customerInfo.name}
                onChange={(e) =>
                  onCustomerInfoChange({
                    ...customerInfo,
                    name: e.target.value,
                  })
                }
                className="h-7 text-xs"
                placeholder="고객명 입력"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label
                htmlFor="customer-contact"
                className="text-xs text-muted-foreground"
              >
                연락처
              </Label>
              <Input
                id="customer-contact"
                value={customerInfo.contact}
                onChange={(e) =>
                  onCustomerInfoChange({
                    ...customerInfo,
                    contact: e.target.value,
                  })
                }
                className="h-7 text-xs"
                placeholder="연락처 입력"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 담당자 카드 */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-sm">담당자</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="space-y-1">
            <Label
              htmlFor="sales-person"
              className="text-xs text-muted-foreground"
            >
              담당자 선택
            </Label>
            <Select
              value={salesPerson.name}
              onValueChange={(value) => {
                const selectedStaff = STAFF_LIST.find(
                  (staff) => staff.name === value
                );
                if (selectedStaff) {
                  onSalesPersonChange({
                    name: selectedStaff.name,
                    contact: "", // 연락처는 빈 문자열로 설정
                  });
                }
              }}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="담당자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_LIST.map((staff) => (
                  <SelectItem key={staff.id} value={staff.name}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
