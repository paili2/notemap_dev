import { api } from "@/shared/api/api";

export type ContractFileResponse = {
  id: number;
  contractId: number;
  url: string;
  filename: string | null;
  createdAt: string;
};

export async function getContractFiles(
  contractId: number
): Promise<ContractFileResponse[]> {
  try {
    console.log(`[getContractFiles] 계약 ID: ${contractId}`);
    const response = await api.get<{ data: ContractFileResponse[] }>(
      `/contracts/${contractId}/files`
    );
    console.log(`[getContractFiles] 전체 응답:`, response);
    console.log(`[getContractFiles] response.data:`, response.data);
    console.log(`[getContractFiles] response.data.data:`, response.data.data);
    const files = response.data.data || [];
    console.log(`[getContractFiles] 반환할 파일 배열:`, files);
    return files;
  } catch (error: any) {
    console.error(`[getContractFiles] 에러 발생:`, error);
    console.error(`[getContractFiles] 에러 응답:`, error?.response?.data);
    // 에러가 발생해도 빈 배열 반환 (에러로 인해 전체 조회가 실패하지 않도록)
    return [];
  }
}


