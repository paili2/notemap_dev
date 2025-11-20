import { SalesContractData } from "../types/contract-records";
import { CreateContractRequest, ContractResponse } from "../api/contracts";
import type { ContractAssigneeResponse } from "../api/assignees";
import type { ContractFileResponse } from "../api/files";

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
  // 계약 이미지 URL (http/https 로 시작하는 실제 URL만 전송)
  const validUrls =
    data.contractImages
      ?.map((img) => img.preview)
      .filter(
        (url) => typeof url === "string" && /^https?:\/\//.test(url)
      ) ?? [];

  const request: CreateContractRequest = {
    // 핀(매물) 연동
    pinId: typeof data.pinId === "number" ? data.pinId : undefined,
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
    // 상태 추가 (프론트엔드 4가지 상태 -> 백엔드 3가지 상태 매핑)
    status:
      data.status === "completed"
        ? ("done" as const)
        : data.status === "cancelled" || data.status === "rejected"
        ? ("canceled" as const)
        : ("ongoing" as const),
    // 담당자 분배 추가
    assignees: assignees.length > 0 ? assignees : undefined,
    // 계약 이미지 URL 목록 (검증 통과하는 URL만 전송)
    urls: validUrls.length > 0 ? validUrls : undefined,
  };

  console.log("변환된 요청 데이터 상세:", request);
  console.log("변환된 요청 데이터 - urls:", request.urls);
  console.log("변환된 요청 데이터 - validUrls:", validUrls);
  console.log("변환된 요청 데이터 - contractImages:", data.contractImages);
  return request;
}

// 백엔드 ContractResponse를 프론트엔드 SalesContractData로 변환
export function transformContractResponseToSalesContract(
  contract: ContractResponse,
  opts?: {
    assignees?: ContractAssigneeResponse[];
    files?: ContractFileResponse[];
  }
): SalesContractData {
  const staffAllocations =
    opts?.assignees?.map((a) => ({
      id: String(a.id),
      name:
        a.assigneeName ||
        a.account?.name ||
        (a.role === "company" ? "회사" : a.accountId ? `직원 #${a.accountId}` : ""),
      // accountId 우선순위: assignee의 accountId -> account.id
      accountId: a.accountId ?? a.account?.id ?? undefined,
      type: a.role === "company" ? ("company" as const) : ("employee" as const),
      percentage: Number(a.sharePercent) || 0, // 문자열을 숫자로 변환
      isDirectInput: a.isManual,
      rebateAllowance: Number(a.rebateAmount) || 0, // 문자열을 숫자로 변환
      finalAllowance: Number(a.finalAmount) || 0, // 문자열을 숫자로 변환
    })) ?? [];

  // 접근 가능한 URL인지 확인 (s3:// 형태는 브라우저에서 접근 불가)
  const isAccessibleUrl = (url?: string | null): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // URL을 접근 가능한 형태로 변환 (s3:// -> undefined)
  const getAccessibleUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    // s3:// 형태는 브라우저에서 접근 불가
    if (url.startsWith('s3://')) {
      console.warn('⚠️ 계약 이미지 s3:// 형태의 URL은 브라우저에서 접근할 수 없습니다:', url);
      return undefined; // 프리사인 URL 생성 API 필요
    }
    return url;
  };

  const contractImages =
    opts?.files
      ?.map((f) => {
        const accessibleUrl = getAccessibleUrl(f.url);
        if (!accessibleUrl) {
          console.warn('⚠️ 계약 이미지 URL이 접근 불가능합니다. id:', f.id, 'url:', f.url);
        }
        return {
          id: String(f.id),
          // 접근 가능한 URL만 preview로 사용
          preview: accessibleUrl || '',
          // 기존 타입 호환을 위해 빈 File 객체 사용 (UI에서는 preview만 사용)
          file: new File([], f.filename || "contract-image"),
        };
      })
      .filter((img) => img.preview) ?? []; // 접근 불가능한 URL 필터링
  
  console.log("transformContractResponseToSalesContract - files:", opts?.files);
  console.log("transformContractResponseToSalesContract - contractImages:", contractImages);

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
      brokerageFee: Number(contract.brokerageFee) || 0,
      vat: Number(contract.vat) || 0,
      vatStatus: contract.vat > 0 ? "vat-included" : "vat-excluded",
      totalBrokerageFee: Number(contract.brokerageTotal) || 0,
      totalRebate: Number(contract.rebateTotal) || 0,
      taxStatus: contract.isTaxed ? "taxable" : "tax-free",
      totalSupportAmount: Number(contract.supportAmount) || 0,
      customerAccountNumber: "", // 백엔드에 없음
      customerBank: "", // 백엔드에 없음
      supportContent: contract.calcMemo || "",
    },
    staffAllocations,
    contractImages,
    // 백엔드 grandTotal 대신 프론트엔드에서 계산
    // 계산 공식: (중개보수금합계) + (과세시 리베이트 × 0.967, 비과세시 리베이트) - 지원금액
    totalCalculation: (() => {
      const brokerageAndVat = Number(contract.brokerageTotal) || 0;
      const rebateAmount = contract.isTaxed
        ? (Number(contract.rebateTotal) || 0) * 0.967
        : Number(contract.rebateTotal) || 0;
      const totalSupportAmount = Number(contract.supportAmount) || 0;
      return brokerageAndVat - totalSupportAmount + rebateAmount;
    })(),
    contractDate: contract.contractDate,
    status:
      contract.status === "done"
        ? "completed"
        : contract.status === "canceled"
        ? "cancelled" // 백엔드 canceled는 해약으로 매핑 (부결은 별도 관리 필요시 확장)
        : "ongoing",
    createdAt: contract.createdAt,
    updatedAt: contract.createdAt,
  };
}

// 프론트엔드 ContractData를 백엔드 ContractResponse로 변환 (계약 관리용)
export function transformContractResponseToContractData(
  contract: ContractResponse
): {
  id: string;
  contractNumber: string;
  customerName: string;
  customerContact: string;
  salesPerson: string;
  salesPersonSalary: number;
  totalCalculation: number;
  contractDate: string;
  amount: number;
  status: "ongoing" | "rejected" | "cancelled" | "completed";
  createdAt: string;
  backendContractId: string | number;
} {
  // 백엔드 grandTotal 대신 프론트엔드에서 계산 (반올림 방지)
  const calculatedTotal = (() => {
    const brokerageAndVat = Number(contract.brokerageTotal) || 0;
    const rebateAmount = contract.isTaxed
      ? (Number(contract.rebateTotal) || 0) * 0.967
      : Number(contract.rebateTotal) || 0;
    const totalSupportAmount = Number(contract.supportAmount) || 0;
    return brokerageAndVat - totalSupportAmount + rebateAmount;
  })();

  return {
    id: contract.id.toString(),
    contractNumber: `CONTRACT-${contract.id}`,
    customerName: contract.customerName || "",
    customerContact: contract.customerPhone || "",
    salesPerson: contract.salesperson?.name || "",
    salesPersonSalary: 0, // 백엔드에 없음, 기본값
    totalCalculation: calculatedTotal,
    contractDate: contract.contractDate,
    amount: calculatedTotal,
    status:
      contract.status === "done"
        ? ("completed" as const)
        : contract.status === "canceled"
        ? ("cancelled" as const) // 백엔드 canceled는 해약으로 매핑
        : ("ongoing" as const),
    createdAt: contract.createdAt,
    backendContractId: contract.id,
  };
}
