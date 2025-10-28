import { SalesContractData } from "../types/contract-records";
import { CreateContractRequest, ContractResponse } from "../api/contracts";

// 프론트엔드 SalesContractData를 백엔드 CreateContractRequest로 변환
export function transformSalesContractToCreateRequest(
  data: SalesContractData
): CreateContractRequest {
  // 최소한의 필수 필드만 전송
  const request = {
    brokerageFee: Number(data.financialInfo.brokerageFee) || 0,
    vat: Number(data.financialInfo.vat) || 0,
    brokerageTotal: Number(data.financialInfo.totalBrokerageFee) || 0,
    rebateTotal: Number(data.financialInfo.totalRebate) || 0,
    supportAmount: Number(data.financialInfo.totalSupportAmount) || 0,
    isTaxed: Boolean(data.financialInfo.taxStatus === "taxable"),
    grandTotal: Number(data.totalCalculation) || 0,
  };

  console.log("변환된 요청 데이터 상세:", request);
  return request;
}

// 백엔드 ContractResponse를 프론트엔드 SalesContractData로 변환
export function transformContractResponseToSalesContract(
  contract: ContractResponse
): SalesContractData {
  return {
    id: contract.id.toString(),
    contractNumber: `CONTRACT-${contract.id}`,
    customerInfo: {
      name: contract.customerName || "",
      contact: contract.customerPhone || "",
    },
    salesManager: contract.distributorName
      ? {
          name: contract.distributorName,
          contact: contract.distributorPhone || "",
        }
      : undefined,
    salesPerson: {
      name: contract.salespersonName || "",
      contact: contract.salespersonPhone || "",
    },
    financialInfo: {
      brokerageFee: contract.brokerageFee,
      vat: contract.vat,
      vatStatus: contract.vat > 0 ? "vat-included" : "vat-excluded",
      totalBrokerageFee: contract.brokerageTotal,
      totalRebate: contract.rebateTotal,
      taxStatus: contract.isTaxed ? "taxable" : "tax-free",
      totalSupportAmount: contract.supportAmount,
      customerAccountNumber: "", // 백엔드에 없음
      customerBank: "", // 백엔드에 없음
      supportContent: contract.calcMemo || "",
    },
    staffAllocations: [], // 백엔드에 별도 테이블 필요
    contractImages: [], // 백엔드에 별도 테이블 필요
    totalCalculation: contract.grandTotal,
    contractDate: contract.createdAt,
    status: "completed", // 기본값
    createdAt: contract.createdAt,
    updatedAt: contract.createdAt,
  };
}

// 프론트엔드 ContractData를 백엔드 ContractResponse로 변환 (계약 관리용)
export function transformContractResponseToContractData(
  contract: ContractResponse
) {
  return {
    id: contract.id.toString(),
    contractNumber: `CONTRACT-${contract.id}`,
    customerName: contract.customerName || "",
    customerContact: contract.customerPhone || "",
    salesPerson: contract.salespersonName || "",
    salesPersonSalary: 0, // 백엔드에 없음, 기본값
    totalCalculation: contract.grandTotal,
    contractDate: contract.createdAt,
    amount: contract.grandTotal,
    status: "completed" as const,
    createdAt: contract.createdAt,
  };
}
