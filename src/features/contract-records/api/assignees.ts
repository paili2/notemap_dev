import { api } from "@/shared/api/api";

export type ContractAssigneeResponse = {
  id: number;
  accountId?: string | null;
  assigneeName?: string | null;
  role: "company" | "staff";
  sharePercent: number;
  rebateAmount: number;
  finalAmount: number;
  isManual: boolean;
  sortOrder: number;
  // relations: ['account'] 를 로드하므로 이름은 account.name 에 들어옴
  account?: {
    id: string;
    name: string | null;
  } | null;
};

export async function getContractAssignees(
  contractId: number
): Promise<ContractAssigneeResponse[]> {
  const response = await api.get<{ data: ContractAssigneeResponse[] }>(
    `/contracts/${contractId}/assignees`
  );
  return response.data.data;
}


