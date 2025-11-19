"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Table, SearchBar, processTableData } from "@/features/table";
import type { ContractData } from "../types";
import {
  contractTableColumns,
  searchKeys,
  paginationConfig,
} from "../utils/tableConfig";
import {
  getContract,
  getContracts,
} from "@/features/contract-records/api/contracts";
import { getContractAssignees } from "@/features/contract-records/api/assignees";
import { getContractFiles } from "@/features/contract-records/api/files";
import {
  transformContractResponseToContractData,
  transformContractResponseToSalesContract,
} from "@/features/contract-records/utils/contractTransformers";
import { SalesContractRecordsModal } from "@/features/contract-records/components/SalesContractRecordsModal";
import type { SalesContractData } from "@/features/contract-records/types/contract-records";
import { useToast } from "@/hooks/use-toast";

export function ContractManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<SalesContractData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // 계약 목록 로드
  const loadContracts = async () => {
    try {
      const contractData = await getContracts({
        page: currentPage,
        size: paginationConfig.listsPerPage,
      });

      const transformedContracts = contractData.items.map(
        transformContractResponseToContractData
      );
      setContracts(transformedContracts);
    } catch (error: any) {
      console.error("계약 목록 로드 실패:", error);
      // API 실패 시 빈 배열로 설정
      setContracts([]);

      toast({
        title: "계약 목록 로드 실패",
        description: "백엔드 서버를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContracts(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [currentPage]);

  // 데이터 처리
  const { processedData, pagination } = useMemo(() => {
    return processTableData(contracts, {
      searchTerm,
      searchKeys: [...searchKeys],
      currentPage,
      listsPerPage: paginationConfig.listsPerPage,
    });
  }, [contracts, searchTerm, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = async (row: ContractData, index: number) => {
    console.log("계약 클릭:", row, index);
    try {
      const id = Number(row.backendContractId ?? row.id);

      // 1) 기본 계약 정보
      const contract = await getContract(id);

      // 2) 담당자 분배 / 계약 파일 병렬 조회
      const [assignees, files] = await Promise.all([
        getContractAssignees(id),
        getContractFiles(id),
      ]);

      console.log("[ContractManagement] getContractFiles 결과:", files);
      console.log("[ContractManagement] files 배열 길이:", files?.length);

      const fullData = transformContractResponseToSalesContract(contract, {
        assignees,
        files,
      });
      console.log("계약 상세 데이터:", fullData);
      console.log("계약 이미지:", fullData.contractImages);
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

  // 계약 상태 업데이트 함수
  const updateContractStatus = (
    contractId: string,
    newStatus: ContractData["status"]
  ) => {
    setContracts((prevContracts) =>
      prevContracts.map((contract) =>
        contract.id === contractId
          ? { ...contract, status: newStatus }
          : contract
      )
    );
  };

  return (
    <>
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">계약 관리</h1>
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="계약번호, 고객명, 담당자로 검색..."
            />
          </div>
        </div>

        <Table
          data={processedData}
          columns={contractTableColumns}
          pagination={pagination}
          loading={isLoadingContracts}
          emptyMessage="계약이 없습니다."
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
