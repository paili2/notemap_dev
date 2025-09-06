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
import type { FinancialInfo } from "../types/contract-records";
import { formatCurrency } from "../lib/utils";

interface FinancialInfoSectionProps {
  financialInfo: FinancialInfo;
  onFinancialInfoChange: (info: FinancialInfo) => void;
}

export function FinancialInfoSection({
  financialInfo,
  onFinancialInfoChange,
}: FinancialInfoSectionProps) {
  const handleInputChange = (
    field: keyof FinancialInfo,
    value: string | number
  ) => {
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    onFinancialInfoChange({ ...financialInfo, [field]: numValue });
  };

  const handleRebateInputChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    // 리베이트 입력값을 실제 금액으로 변환 (1 = 100만원, 0.5 = 50만원)
    const actualAmount = numValue * 1000000;
    onFinancialInfoChange({ ...financialInfo, totalRebate: actualAmount });
  };

  const handleTaxStatusChange = (value: string) => {
    onFinancialInfoChange({
      ...financialInfo,
      taxStatus: value as "taxable" | "tax-free",
    });
  };

  return (
    <Card className="flex-shrink-0">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-sm">금액 정보</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">중개보수금</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={
                  financialInfo.brokerageFee === 0
                    ? ""
                    : financialInfo.brokerageFee
                }
                onChange={(e) =>
                  handleInputChange("brokerageFee", e.target.value)
                }
                className="h-7 text-xs w-24"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">원</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">부가세</Label>
            <Select
              value={financialInfo.vatStatus || "vat-included"}
              onValueChange={(value) =>
                onFinancialInfoChange({
                  ...financialInfo,
                  vatStatus: value as "vat-included" | "vat-excluded",
                })
              }
            >
              <SelectTrigger className="h-7 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vat-included" className="text-xs">
                  부가세
                </SelectItem>
                <SelectItem value="vat-excluded" className="text-xs">
                  미부가세
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              중개보수금합계
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={financialInfo.totalBrokerageFee}
                onChange={(e) =>
                  handleInputChange("totalBrokerageFee", e.target.value)
                }
                className="h-7 text-xs w-24"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">원</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              총리베이트(R)
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.1"
                value={
                  financialInfo.totalRebate === 0
                    ? ""
                    : financialInfo.totalRebate / 1000000
                }
                onChange={(e) => handleRebateInputChange(e.target.value)}
                className="h-7 text-xs w-24"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">R</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">과세 여부</Label>
            <Select
              value={financialInfo.taxStatus}
              onValueChange={handleTaxStatusChange}
            >
              <SelectTrigger className="h-7 text-xs w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taxable" className="text-xs">
                  과세
                </SelectItem>
                <SelectItem value="tax-free" className="text-xs">
                  비과세
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">총지원금액</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={financialInfo.totalSupportAmount}
                onChange={(e) =>
                  handleInputChange("totalSupportAmount", e.target.value)
                }
                className="h-7 text-xs w-24"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">원</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              리베이트 최종금
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={financialInfo.finalRebateAmount}
                onChange={(e) =>
                  handleInputChange("finalRebateAmount", e.target.value)
                }
                className="h-7 text-xs w-24"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">원</span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {/* 계산 공식들 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>계산 공식:</div>
            <div>
              • (중개보수금 + 부가세) + 리베이트 - 지원금액 ={" "}
              {(() => {
                const brokerageAndVat =
                  financialInfo.brokerageFee + financialInfo.vat;
                const totalBeforeTax =
                  brokerageAndVat +
                  financialInfo.totalRebate -
                  financialInfo.totalSupportAmount;
                const finalTotal =
                  financialInfo.taxStatus === "taxable"
                    ? totalBeforeTax * 0.967 // 과세시 3.3% 차감
                    : totalBeforeTax; // 비과세시 그대로
                return formatCurrency(finalTotal);
              })()}
              원
            </div>
            <div className="text-xs text-gray-500">
              {financialInfo.taxStatus === "taxable"
                ? "• 과세 적용 (전체 금액 3.3% 차감)"
                : "• 비과세 적용"}
            </div>
          </div>

          {/* 총 합계 */}
          <div className="p-2 bg-primary/10 rounded-lg">
            <div className="text-sm font-medium mb-1">총 합계</div>
            <div className="text-lg font-bold text-primary">
              {(() => {
                const brokerageAndVat =
                  financialInfo.brokerageFee + financialInfo.vat;
                const totalBeforeTax =
                  brokerageAndVat +
                  financialInfo.totalRebate -
                  financialInfo.totalSupportAmount;
                const finalTotal =
                  financialInfo.taxStatus === "taxable"
                    ? totalBeforeTax * 0.967 // 과세시 3.3% 차감
                    : totalBeforeTax; // 비과세시 그대로
                return formatCurrency(finalTotal);
              })()}
              원
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
