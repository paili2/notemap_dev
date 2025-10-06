"use client";

import React, { useState, useMemo } from "react";
import { Table, SearchBar, processTableData } from "@/features/table";
import type { ContractData } from "../types";
import type { SalesContractData } from "@/features/contract-records/types/contract-records";
import { mockContracts } from "../data/mockContracts";
import {
  contractTableColumns,
  searchKeys,
  paginationConfig,
} from "../utils/tableConfig";
import { transformSalesContractToContract } from "../utils/dataTransformer";

export function ContractManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractData[]>(mockContracts);

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

  const handleRowClick = (row: ContractData, index: number) => {
    console.log("계약 클릭:", row, index);
    // TODO: 계약 상세 페이지로 이동
  };

  // 새로운 계약 추가 함수 (contract-records에서 호출될 예정)
  const addNewContract = (salesContractData: SalesContractData) => {
    const newContract = transformSalesContractToContract(salesContractData);
    setContracts((prevContracts) => [newContract, ...prevContracts]);
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
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">계약 관리</h1>
        <div className="w-80">
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
        loading={loading}
        emptyMessage="계약이 없습니다."
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
