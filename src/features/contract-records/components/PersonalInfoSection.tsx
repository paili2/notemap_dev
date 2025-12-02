"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { formatPhone } from "@/lib/formatPhone";
import type { PersonInfo } from "../types/contract-records";

interface PersonalInfoSectionProps {
  customerInfo: PersonInfo;
  salesPerson: PersonInfo;
  onCustomerInfoChange: (info: PersonInfo) => void;
  onSalesPersonChange: (info: PersonInfo) => void;
  readOnly?: boolean;
}

export function PersonalInfoSection({
  customerInfo,
  salesPerson,
  onCustomerInfoChange,
  onSalesPersonChange,
  readOnly = false,
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
                readOnly={readOnly}
                disabled={readOnly}
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
                    contact: formatPhone(e.target.value),
                  })
                }
                className="h-7 text-xs"
                placeholder="010-1234-5678"
                readOnly={readOnly}
                disabled={readOnly}
                inputMode="tel"
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
              htmlFor="sales-person-name"
              className="text-xs text-muted-foreground"
            >
              담당자
            </Label>
            <Input
              id="sales-person-name"
              value={salesPerson.name}
              readOnly
              className="h-7 text-xs bg-muted"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
