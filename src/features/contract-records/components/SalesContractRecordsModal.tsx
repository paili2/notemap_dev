"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog/Dialog";
import { Button } from "@/components/atoms/Button/Button";
import { Separator } from "@/components/atoms/Separator/Separator";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { FinancialInfoSection } from "./FinancialInfoSection";
import type {
  SalesContractViewModalProps,
  SalesContractData,
} from "../types/contract-records";
import { formatCurrency, calculateVAT } from "../lib/utils";
import { StaffAllocationSection } from "./StaffAllocationSection";
import { ContractImageSection } from "./ContractImageSection";

// 기본 데이터
const defaultData: SalesContractData = {
  customerInfo: { name: "", contact: "" },
  salesManager: { name: "", contact: "" },
  salesPerson: { name: "", contact: "" },
  financialInfo: {
    brokerageFee: 0,
    vat: 0,
    vatStatus: "vat-included",
    totalBrokerageFee: 0,
    totalRebate: 0,
    taxStatus: "taxable",
    totalSupportAmount: 0,
  },
  staffAllocations: [
    {
      id: "company",
      name: "회사",
      type: "company",
      percentage: 100,
      isDirectInput: false,
      rebateAllowance: 0,
      finalAllowance: 0,
    },
    {
      id: "employee1",
      name: "영업담당자",
      type: "employee",
      percentage: 0,
      isDirectInput: false,
      rebateAllowance: 0,
      finalAllowance: 0,
    },
  ],
  contractImages: [],
  totalCalculation: 0,
};

export function SalesContractRecordsModal({
  isOpen,
  onClose,
  data: initialData,
  onDataChange,
}: SalesContractViewModalProps) {
  const [data, setData] = useState<SalesContractData>(
    initialData || defaultData
  );

  // 초기 데이터가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // 데이터 변경 핸들러
  const handleDataChange = (newData: SalesContractData) => {
    setData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  // 인적 정보 변경 핸들러
  const handleCustomerInfoChange = (customerInfo: any) => {
    handleDataChange({ ...data, customerInfo });
  };

  const handleSalesManagerChange = (salesManager: any) => {
    handleDataChange({ ...data, salesManager });
  };

  const handleSalesPersonChange = (salesPerson: any) => {
    handleDataChange({ ...data, salesPerson });
  };

  // 재무 정보 변경 핸들러
  const handleFinancialInfoChange = (financialInfo: any) => {
    // 부가세 자동 계산 (부가세 선택시 10%, 미부가세 선택시 0%)
    const vat = calculateVAT(
      financialInfo.brokerageFee,
      financialInfo.vatStatus
    );

    // 중개보수금합계 자동 계산
    const totalBrokerageFee = financialInfo.brokerageFee + vat;

    const updatedFinancialInfo = {
      ...financialInfo,
      vat,
      totalBrokerageFee,
    };

    // 총 계산 자동 업데이트
    const totalCalculation =
      totalBrokerageFee +
      financialInfo.totalRebate -
      financialInfo.totalSupportAmount;

    handleDataChange({
      ...data,
      financialInfo: updatedFinancialInfo,
      totalCalculation,
    });
  };

  // 담당자 분배 변경 핸들러
  const handleStaffAllocationsChange = (staffAllocations: any) => {
    handleDataChange({ ...data, staffAllocations });
  };

  // 계약 이미지 변경 핸들러
  const handleContractImagesChange = (contractImages: any) => {
    handleDataChange({ ...data, contractImages });
  };

  // 저장 핸들러
  const handleSave = () => {
    // 여기에 저장 로직 추가
    console.log("저장된 데이터:", data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none w-[80vw] max-w-[1000px] h-[95vh] max-h-[900px] overflow-y-auto p-2 sm:p-3 md:p-4">
        <DialogHeader className="pb-1 flex-shrink-0">
          <DialogTitle className="text-lg font-bold">
            영업 계약기록 관리
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {/* 인적 정보 */}
          <PersonalInfoSection
            customerInfo={data.customerInfo}
            salesManager={data.salesManager}
            salesPerson={data.salesPerson}
            onCustomerInfoChange={handleCustomerInfoChange}
            onSalesManagerChange={handleSalesManagerChange}
            onSalesPersonChange={handleSalesPersonChange}
          />

          {/* 재무 정보 */}
          <FinancialInfoSection
            financialInfo={data.financialInfo}
            onFinancialInfoChange={handleFinancialInfoChange}
          />

          {/* 담당자 분배 */}
          <StaffAllocationSection
            staffAllocations={data.staffAllocations}
            onStaffAllocationsChange={handleStaffAllocationsChange}
            totalCalculation={data.totalCalculation}
            totalRebate={data.financialInfo.totalRebate}
          />

          {/* 계약 이미지 */}
          <ContractImageSection onImagesChange={handleContractImagesChange} />
        </div>

        <Separator className="flex-shrink-0" />

        <div className="flex justify-end space-x-2 pt-1 flex-shrink-0">
          <Button onClick={onClose} className="h-7 text-xs">
            닫기
          </Button>
          <Button onClick={handleSave} className="h-7 text-xs">
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
