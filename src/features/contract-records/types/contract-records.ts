export interface PersonInfo {
  name: string;
  contact: string;
}

export interface FinancialInfo {
  brokerageFee: number;
  vat: number;
  vatStatus: "vat-included" | "vat-excluded";
  totalBrokerageFee: number;
  totalRebate: number;
  taxStatus: "taxable" | "tax-free";
  totalSupportAmount: number;
  customerAccountNumber: string;
  customerBank: string;
  supportContent: string;
}

export interface StaffAllocation {
  id: string;
  name: string;
  type: "company" | "employee";
  percentage: number;
  isDirectInput: boolean;
  rebateAllowance: number;
  finalAllowance: number;
}

export interface ContractImage {
  id: string;
  file: File;
  preview: string;
}

export interface SalesContractData {
  id?: string; // 백엔드에서 생성
  contractNumber?: string; // 백엔드에서 생성
  customerInfo: PersonInfo;
  salesManager?: PersonInfo; // 선택적 필드로 변경 (사용하지 않음)
  salesPerson: PersonInfo;
  financialInfo: FinancialInfo;
  staffAllocations: StaffAllocation[];
  contractImages: ContractImage[];
  totalCalculation: number;
  contractDate?: string; // 계약일 (자동 생성)
  status?: "completed" | "pending" | "cancelled"; // 계약 상태
  createdAt?: string; // 생성일
  updatedAt?: string; // 수정일
}

export interface SalesContractViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: SalesContractData;
  onDataChange?: (data: SalesContractData) => void;
}
