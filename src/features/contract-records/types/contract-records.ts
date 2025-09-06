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
  finalRebateAmount: number;
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
  customerInfo: PersonInfo;
  salesManager: PersonInfo;
  salesPerson: PersonInfo;
  financialInfo: FinancialInfo;
  staffAllocations: StaffAllocation[];
  contractImages: ContractImage[];
  totalCalculation: number;
}

export interface SalesContractViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: SalesContractData;
  onDataChange?: (data: SalesContractData) => void;
}
