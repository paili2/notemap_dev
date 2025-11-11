import { SalesContractData } from "../types/contract-records";
import { CreateContractRequest, ContractResponse } from "../api/contracts";

type ProfileData =
  | {
      account?: {
        id: string;
        name: string | null;
        phone: string | null;
      } | null;
    }
  | undefined;

// 프론트엔드 SalesContractData를 백엔드 CreateContractRequest로 변환
export function transformSalesContractToCreateRequest(
  data: SalesContractData,
  profile?: ProfileData
): CreateContractRequest {
  // 담당자는 항상 로그인한 사용자
  const salespersonAccountId = profile?.account?.id;

  // 담당자 분배 변환
  const assignees = data.staffAllocations.map((allocation, index) => ({
    accountId:
      allocation.type === "employee" ? allocation.accountId : undefined,
    role:
      allocation.type === "company" ? ("company" as const) : ("staff" as const),
    sharePercent: allocation.percentage,
    rebateAmount: allocation.rebateAllowance ?? 0,
    finalAmount: allocation.finalAllowance ?? 0,
    isManual: allocation.isDirectInput ?? false,
    sortOrder: index + 1,
  }));

  // 최소한의 필수 필드만 전송
  const request: CreateContractRequest = {
    brokerageFee: Number(data.financialInfo.brokerageFee) || 0,
    vat: Number(data.financialInfo.vat) || 0,
    brokerageTotal: Number(data.financialInfo.totalBrokerageFee) || 0,
    rebateTotal: Number(data.financialInfo.totalRebate) || 0,
    supportAmount: Number(data.financialInfo.totalSupportAmount) || 0,
    isTaxed: Boolean(data.financialInfo.taxStatus === "taxable"),
    grandTotal: Number(data.totalCalculation) || 0,
    // 고객 정보 추가
    customerName: data.customerInfo.name || undefined,
    customerPhone: data.customerInfo.contact || undefined,
    // 담당자 ID 추가
    salespersonAccountId,
    createdByAccountId: profile?.account?.id,
    // 계산 메모 추가
    calcMemo: data.financialInfo.supportContent || undefined,
    // 계약 날짜 추가
    contractDate: data.contractDate,
    // 상태 추가
    status:
      data.status === "completed"
        ? ("done" as const)
        : data.status === "cancelled"
        ? ("canceled" as const)
        : ("ongoing" as const),
    // 담당자 분배 추가
    assignees: assignees.length > 0 ? assignees : undefined,
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
    salesManager: undefined, // 백엔드에 없음
    salesPerson: {
      name: contract.salesperson?.name || "",
      contact: contract.salesperson?.phone || "",
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
    contractDate: contract.contractDate,
    status:
      contract.status === "done"
        ? "completed"
        : contract.status === "canceled"
        ? "cancelled"
        : "pending",
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
    salesPerson: contract.salesperson?.name || "",
    salesPersonSalary: 0, // 백엔드에 없음, 기본값
    totalCalculation: contract.grandTotal,
    contractDate: contract.contractDate,
    amount: contract.grandTotal,
    status:
      contract.status === "done"
        ? ("completed" as const)
        : contract.status === "canceled"
        ? ("cancelled" as const)
        : ("pending" as const),
    createdAt: contract.createdAt,
  };
}
