"use client";

import React, { useCallback } from "react";
import { ContractList } from "@/features/contract-list";
import type { ContractData } from "@/components/contract-management/types";
import { getContracts } from "@/features/contract-records/api/contracts";
import { transformContractResponseToContractData } from "@/features/contract-records/utils/contractTransformers";
import { paginationConfig } from "../utils/tableConfig";

export function ContractManagement() {
  const loadContracts = useCallback(async (page: number): Promise<ContractData[]> => {
    const contractData = await getContracts({
      page,
      size: paginationConfig.listsPerPage,
    });

    return contractData.items.map(transformContractResponseToContractData);
  }, []);

  return (
    <ContractList
      title="계약 관리"
      loadContracts={loadContracts}
      initialLoading={true}
    />
  );
}
