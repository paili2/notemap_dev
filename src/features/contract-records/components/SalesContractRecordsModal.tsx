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
import { formatCurrency, calculateVAT } from "../utils/utils";
import { StaffAllocationSection } from "./StaffAllocationSection";
import { ContractImageSection } from "./ContractImageSection";
import { createContract } from "../api/contracts";
import { transformSalesContractToCreateRequest } from "../utils/contractTransformers";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/features/users/api/account";
import { api } from "@/shared/api/api";
import { getTeams } from "@/features/teams";

// 기본 데이터
const defaultData: SalesContractData = {
  customerInfo: { name: "", contact: "" },
  salesManager: { name: "", contact: "" }, // 사용하지 않지만 기본값으로 유지
  salesPerson: { name: "", contact: "" },
  financialInfo: {
    brokerageFee: 0,
    vat: 0,
    vatStatus: "vat-included",
    totalBrokerageFee: 0,
    totalRebate: 0,
    taxStatus: "taxable",
    totalSupportAmount: 0,
    customerAccountNumber: "",
    customerBank: "",
    supportContent: "",
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 프로필 정보 가져오기
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 10 * 60 * 1000, // 10분
  });

  // 내 팀 멤버 가져오기
  const { data: myTeamMembers } = useQuery({
    queryKey: ["my-team-members"],
    queryFn: async () => {
      try {
        // 프로필에서 accountId 가져오기
        const accountId = profile?.account?.id;
        if (!accountId) return [];

        // 팀 목록 가져오기
        const teams = await getTeams();
        if (teams.length === 0) return [];

        // 각 팀의 상세 조회를 통해 내가 속한 팀 찾기
        for (const team of teams) {
          try {
            const teamDetailResponse = await api.get<{
              message: string;
              data: {
                id: string;
                name: string;
                members: Array<{
                  accountId: string;
                  name: string | null;
                }>;
              };
            }>(`/dashboard/accounts/teams/${team.id}`);

            const isMyTeam = teamDetailResponse.data.data.members.some(
              (member) => String(member.accountId) === String(accountId)
            );

            if (isMyTeam) {
              return teamDetailResponse.data.data.members;
            }
          } catch (error) {
            console.error(`팀 ${team.id} 조회 실패:`, error);
            continue;
          }
        }
        return [];
      } catch (error) {
        console.error("팀 멤버 조회 실패:", error);
        return [];
      }
    },
    enabled: !!profile?.account?.id,
    staleTime: 10 * 60 * 1000, // 10분
  });

  // 초기 데이터가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // 프로필 정보가 로드되면 담당자 정보 자동 채우기
  useEffect(() => {
    if (profile && !initialData && isOpen) {
      setData((prevData) => ({
        ...prevData,
        salesPerson: {
          name: profile.account?.name || "",
          contact: profile.account?.phone || "",
        },
      }));
    }
  }, [profile, initialData, isOpen]);

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
  const handleSave = async () => {
    // 필수 데이터 검증
    if (!data.customerInfo.name.trim()) {
      toast({
        title: "입력 오류",
        description: "고객명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!data.salesPerson.name.trim()) {
      toast({
        title: "입력 오류",
        description: "담당자를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (data.totalCalculation <= 0) {
      toast({
        title: "입력 오류",
        description: "계약금액을 확인해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 백엔드 API 형식으로 변환
      const requestData = transformSalesContractToCreateRequest(data);
      console.log("변환된 요청 데이터:", requestData);

      // 필수 필드 검증
      if (
        typeof requestData.brokerageFee !== "number" ||
        typeof requestData.vat !== "number" ||
        typeof requestData.brokerageTotal !== "number" ||
        typeof requestData.rebateTotal !== "number" ||
        typeof requestData.supportAmount !== "number" ||
        typeof requestData.grandTotal !== "number" ||
        typeof requestData.isTaxed !== "boolean"
      ) {
        throw new Error("필수 필드의 데이터 타입이 올바르지 않습니다.");
      }

      // 백엔드 API 호출
      const result = await createContract(requestData);
      console.log("API 응답:", result);

      // 계약 데이터에 메타데이터 추가
      const now = new Date();
      const contractData = {
        ...data,
        id: result.id.toString(),
        contractNumber: `CONTRACT-${result.id}`,
        contractDate: data.contractDate || now.toISOString().split("T")[0],
        status: data.status || "completed",
        createdAt: data.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      };

      toast({
        title: "계약 생성 완료",
        description: `계약 #${result.id}이 성공적으로 생성되었습니다.`,
      });

      // 계약관리 리스트 업데이트를 위한 콜백
      if (onDataChange) {
        onDataChange(contractData);
      }

      onClose();
    } catch (error: any) {
      console.error("계약 생성 실패:", error);
      toast({
        title: "계약 생성 실패",
        description: "계약 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[100vw] max-w-[1240px] h-[95vh] max-h-[900px] p-0 flex flex-col">
        {/* 고정 헤더 */}
        <DialogHeader className="pb-1 flex-shrink-0 p-4 border-b">
          <DialogTitle className="text-lg font-bold">
            영업 계약기록 관리
          </DialogTitle>
        </DialogHeader>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {/* 인적 정보 */}
            <PersonalInfoSection
              customerInfo={data.customerInfo}
              salesPerson={data.salesPerson}
              onCustomerInfoChange={handleCustomerInfoChange}
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
              teamMembers={myTeamMembers || []}
            />

            {/* 계약 이미지 */}
            <ContractImageSection onImagesChange={handleContractImagesChange} />
          </div>
        </div>

        {/* 고정 하단 버튼 영역 */}
        <div className="flex-shrink-0 border-t p-4">
          <Separator className="mb-3" />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={onClose}
              className="h-7 text-xs"
              disabled={isLoading}
            >
              닫기
            </Button>
            <Button
              onClick={handleSave}
              className="h-7 text-xs"
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
