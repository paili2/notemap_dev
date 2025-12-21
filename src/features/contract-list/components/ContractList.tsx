"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Table, SearchBar, processTableData } from "@/features/table";
import type { ContractData } from "@/components/contract-management/types";
import {
  contractTableColumns,
  searchKeys,
  paginationConfig,
} from "@/components/contract-management/utils/tableConfig";
import { getContract } from "@/features/contract-records/api/contracts";
import { getContractAssignees } from "@/features/contract-records/api/assignees";
import { getContractFiles } from "@/features/contract-records/api/files";
import { transformContractResponseToSalesContract } from "@/features/contract-records/utils/contractTransformers";
import { SalesContractRecordsModal } from "@/features/contract-records/components/SalesContractRecordsModal";
import type { SalesContractData } from "@/features/contract-records/types/contract-records";
import { useToast } from "@/hooks/use-toast";

interface ContractListProps {
  title: string;
  loadContracts: (page: number) => Promise<ContractData[]> | Promise<{ items: ContractData[]; total: number }>;
  initialLoading?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function ContractList({
  title,
  loadContracts: loadContractsFn,
  initialLoading = false,
  searchPlaceholder = "계약번호, 고객명, 담당자로 검색...",
  emptyMessage = "계약이 없습니다.",
}: ContractListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingContracts, setIsLoadingContracts] = useState(initialLoading);
  const [selectedContract, setSelectedContract] =
    useState<SalesContractData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // 계약 목록 로드
  const loadContracts = React.useCallback(async () => {
    try {
      setIsLoadingContracts(true);
      const result = await loadContractsFn(currentPage);
      
      // 백엔드 페이지네이션 사용 여부 확인
      if (result && typeof result === 'object' && 'items' in result && 'total' in result) {
        setContracts(result.items);
        setTotalCount(result.total);
      } else {
        // 기존 형식 (배열만 반환)
        setContracts(result as ContractData[]);
        setTotalCount((result as ContractData[]).length);
      }
    } catch (error: any) {
      console.error("계약 목록 로드 실패:", error);
      setContracts([]);
      setTotalCount(0);

      toast({
        title: "계약 목록 로드 실패",
        description: "백엔드 서버를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContracts(false);
    }
  }, [loadContractsFn, currentPage, toast]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // 데이터 처리 (백엔드 페이지네이션 사용 시 클라이언트 사이드 검색만 적용)
  const { processedData, pagination } = useMemo(() => {
    // 백엔드에서 페이지네이션을 처리한 경우
    if (totalCount > 0 && contracts.length <= paginationConfig.listsPerPage) {
      // 클라이언트 사이드 검색만 적용
      const filtered = searchTerm
        ? contracts.filter((contract) =>
            searchKeys.some((key) => {
              const value = contract[key as keyof ContractData];
              return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
            })
          )
        : contracts;

      const totalPages = Math.ceil(totalCount / paginationConfig.listsPerPage);
      return {
        processedData: filtered,
        pagination: {
          currentPage,
          totalPages,
          listsPerPage: paginationConfig.listsPerPage,
          totalLists: totalCount,
        },
      };
    }
    
    // 기존 방식 (프론트엔드 페이지네이션)
    return processTableData(contracts, {
      searchTerm,
      searchKeys: [...searchKeys],
      currentPage,
      listsPerPage: paginationConfig.listsPerPage,
    });
  }, [contracts, searchTerm, currentPage, totalCount]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = async (row: ContractData, index: number) => {
    console.log("계약 클릭:", row, index);
    try {
      const id = Number(row.backendContractId ?? row.id);

      // 계약 상세 정보 조회 (백엔드에서 assignees와 urls를 포함해서 반환)
      const contract = await getContract(id);

      // 변환 (백엔드 응답에 assignees와 urls가 이미 포함되어 있음)
      const fullData = transformContractResponseToSalesContract(contract);
      setSelectedContract(fullData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("계약 상세 조회 실패:", error);
      toast({
        title: "계약 상세 조회 실패",
        description: "계약 상세 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={searchPlaceholder}
            />
          </div>
        </div>

        <Table
          data={processedData}
          columns={contractTableColumns}
          pagination={pagination}
          loading={isLoadingContracts}
          emptyMessage={emptyMessage}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
        />
      </div>

      <SalesContractRecordsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContract(null);
        }}
        data={selectedContract ?? undefined}
        onDataChange={() => {
          // 수정/삭제 후 목록 새로고침
          loadContracts();
        }}
      />
    </>
  );
}

