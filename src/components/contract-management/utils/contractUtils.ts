import type { StatusConfigMap } from "../types";

// 계약 상태별 설정
export const statusConfigMap: StatusConfigMap = {
  completed: {
    label: "완료",
    className: "bg-green-100 text-green-800",
  },
  pending: {
    label: "진행중",
    className: "bg-yellow-100 text-yellow-800",
  },
  cancelled: {
    label: "취소",
    className: "bg-red-100 text-red-800",
  },
};

// 금액 포맷팅 함수
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()}원`;
};

// 날짜 포맷팅 함수
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("ko-KR");
};

// 계약번호 포맷팅 함수
export const formatContractNumber = (contractNumber: string): string => {
  return contractNumber;
};
