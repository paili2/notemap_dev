import type { ContractData } from "../types";
import type { SalesContractData } from "@/features/contract-records/types/contract-records";

// API 엔드포인트 상수
const API_ENDPOINTS = {
  CONTRACTS: "/api/contracts",
  CONTRACT_BY_ID: (id: string) => `/api/contracts/${id}`,
  UPDATE_STATUS: (id: string) => `/api/contracts/${id}/status`,
} as const;

// 계약 생성 API
export const createContract = async (
  contractData: SalesContractData
): Promise<ContractData> => {
  try {
    const response = await fetch(API_ENDPOINTS.CONTRACTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contractData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("계약 생성 실패:", error);
    throw error;
  }
};

// 계약 목록 조회 API
export const getContracts = async (): Promise<ContractData[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.CONTRACTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("계약 목록 조회 실패:", error);
    throw error;
  }
};

// 계약 상태 업데이트 API
export const updateContractStatus = async (
  contractId: string,
  status: ContractData["status"]
): Promise<ContractData> => {
  try {
    const response = await fetch(API_ENDPOINTS.UPDATE_STATUS(contractId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("계약 상태 업데이트 실패:", error);
    throw error;
  }
};

// 계약 상세 조회 API
export const getContractById = async (
  contractId: string
): Promise<ContractData> => {
  try {
    const response = await fetch(API_ENDPOINTS.CONTRACT_BY_ID(contractId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("계약 상세 조회 실패:", error);
    throw error;
  }
};
