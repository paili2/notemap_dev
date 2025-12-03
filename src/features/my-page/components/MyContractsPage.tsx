"use client";

import React, { useCallback } from "react";
import { ContractList } from "@/features/contract-list";
import type { ContractData } from "@/components/contract-management/types";

export function MyContractsPage() {
  const loadContracts = useCallback(
    async (page: number): Promise<ContractData[]> => {
      // TODO: 백엔드 API 수정 후 연결
      // const contractData = await getMyContracts({
      //   page,
      //   size: paginationConfig.listsPerPage,
      // });
      // const transformedContracts = contractData.items.map(
      //   transformContractResponseToContractData
      // );
      // // 본인 계약만 필터링
      // const myContracts = transformedContracts.filter(
      //   (contract) => contract.salesPerson === profile?.account?.name
      // );
      // return myContracts;

      return [];
    },
    []
  );

  return (
    <ContractList
      title="내 계약"
      loadContracts={loadContracts}
      initialLoading={false}
    />
  );
}
