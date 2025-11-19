"use client";

import { ContractManagement } from "@/components/contract-management/components/ContractManagement";
import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

const ContractsPage = () => {
  return (
    <AdminAuthGuard>
      <ContractManagement />
    </AdminAuthGuard>
  );
};

export default ContractsPage;
