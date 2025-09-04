"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import type { PersonInfo } from "../types/contract-records";

interface PersonalInfoSectionProps {
  customerInfo: PersonInfo;
  salesManager: PersonInfo;
  salesPerson: PersonInfo;
  onCustomerInfoChange: (info: PersonInfo) => void;
  onSalesManagerChange: (info: PersonInfo) => void;
  onSalesPersonChange: (info: PersonInfo) => void;
}

export function PersonalInfoSection({
  customerInfo,
  salesManager,
  salesPerson,
  onCustomerInfoChange,
  onSalesManagerChange,
  onSalesPersonChange,
}: PersonalInfoSectionProps) {
  return (
    <Card className="flex-shrink-0">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-sm">인적 정보</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {/* 고객 정보 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs text-left">고객정보</h3>
            <div className="space-y-2">
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
              <div className="space-y-1">
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
          </div>

          {/* 분양담당자 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs text-left">분양담당자</h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label
                  htmlFor="manager-name"
                  className="text-xs text-muted-foreground"
                >
                  성함
                </Label>
                <Input
                  id="manager-name"
                  value={salesManager.name}
                  onChange={(e) =>
                    onSalesManagerChange({
                      ...salesManager,
                      name: e.target.value,
                    })
                  }
                  className="h-7 text-xs"
                  placeholder="담당자명 입력"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="manager-contact"
                  className="text-xs text-muted-foreground"
                >
                  연락처
                </Label>
                <Input
                  id="manager-contact"
                  value={salesManager.contact}
                  onChange={(e) =>
                    onSalesManagerChange({
                      ...salesManager,
                      contact: e.target.value,
                    })
                  }
                  className="h-7 text-xs"
                  placeholder="연락처 입력"
                />
              </div>
            </div>
          </div>

          {/* 영업자 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs text-left">영업자</h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label
                  htmlFor="sales-name"
                  className="text-xs text-muted-foreground"
                >
                  성함
                </Label>
                <Input
                  id="sales-name"
                  value={salesPerson.name}
                  onChange={(e) =>
                    onSalesPersonChange({
                      ...salesPerson,
                      name: e.target.value,
                    })
                  }
                  className="h-7 text-xs"
                  placeholder="영업자명 입력"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="sales-contact"
                  className="text-xs text-muted-foreground"
                >
                  연락처
                </Label>
                <Input
                  id="sales-contact"
                  value={salesPerson.contact}
                  onChange={(e) =>
                    onSalesPersonChange({
                      ...salesPerson,
                      contact: e.target.value,
                    })
                  }
                  className="h-7 text-xs"
                  placeholder="연락처 입력"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
