import { api } from "@/shared/api/api";

// 백엔드 API 응답 타입
export type ContractResponse = {
  id: number;
  pinId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  distributorName: string | null;
  distributorPhone: string | null;
  salespersonName: string | null;
  salespersonPhone: string | null;
  brokerageFee: number;
  vat: number;
  brokerageTotal: number;
  rebateTotal: number;
  supportAmount: number;
  isTaxed: boolean;
  calcMemo: string | null;
  grandTotal: number;
  createdAt: string;
};

export type ContractListResponse = {
  items: ContractResponse[];
  total: number;
};

// 백엔드 API 요청 타입
export type CreateContractRequest = {
  pinId?: number;
  customerName?: string;
  customerPhone?: string;
  distributorName?: string;
  distributorPhone?: string;
  salespersonName?: string;
  salespersonPhone?: string;
  brokerageFee: number;
  vat: number;
  brokerageTotal: number;
  rebateTotal: number;
  supportAmount: number;
  isTaxed: boolean;
  calcMemo?: string;
  grandTotal: number;
  urls?: string[];
};

export type UpdateContractRequest = Partial<CreateContractRequest>;

export type ListContractsRequest = {
  page?: number;
  size?: number;
  pinId?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  assigneeId?: number;
  hasFiles?: boolean;
};

// 계약 생성 API
export async function createContract(
  data: CreateContractRequest
): Promise<{ id: number }> {
  try {
    console.log("계약 생성 API 호출:", data);

    // 다른 엔드포인트 시도
    const response = await api.post<{
      message: string;
      data: { id: number };
    }>("/dashboard/contracts", data);

    console.log("계약 생성 API 응답:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("계약 생성 API 호출 실패:", error);
    console.error("에러 상세:", error.response?.data);
    console.error("에러 메시지들:", error.response?.data?.messages);
    throw error;
  }
}

// 계약 목록 조회 API
export async function getContracts(
  params?: ListContractsRequest
): Promise<ContractListResponse> {
  try {
    const response = await api.get<{
      data: ContractListResponse;
    }>("/contracts", { params });

    console.log("계약 목록 API 응답:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("계약 목록 API 호출 실패:", error);
    throw error;
  }
}

// 계약 상세 조회 API
export async function getContract(id: number): Promise<ContractResponse> {
  try {
    const response = await api.get<{
      data: ContractResponse;
    }>(`/contracts/${id}`);

    console.log("계약 상세 API 응답:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("계약 상세 API 호출 실패:", error);
    throw error;
  }
}

// 계약 수정 API
export async function updateContract(
  id: number,
  data: UpdateContractRequest
): Promise<{ id: number }> {
  try {
    const response = await api.patch<{
      message: string;
      data: { id: number };
    }>(`/contracts/${id}`, data);

    console.log("계약 수정 API 응답:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("계약 수정 API 호출 실패:", error);
    throw error;
  }
}

// 계약 삭제 API
export async function deleteContract(id: number): Promise<void> {
  try {
    await api.delete(`/contracts/${id}`);
    console.log("계약 삭제 성공:", id);
  } catch (error) {
    console.error("계약 삭제 API 호출 실패:", error);
    throw error;
  }
}
