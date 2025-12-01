export const formatCurrency = (amount: number): string => {
  // NaN이나 undefined인 경우 0으로
  if (isNaN(amount) || amount === undefined || amount === null) {
    return "0";
  }
  return new Intl.NumberFormat("ko-KR").format(amount);
};

// 숫자 문자열에 천 단위 구분자 추가하는 함수
export const formatNumberWithCommas = (value: string): string => {
  // 숫자가 아닌 문자 제거 (쉼표 제외)
  const numericValue = value.replace(/[^0-9]/g, "");
  if (numericValue === "") return "";

  // 천 단위 구분자 추가
  return Number(numericValue).toLocaleString();
};

// 쉼표가 포함된 숫자 문자열을 숫자로 변환하는 함수
export const parseNumberFromFormatted = (value: string): number => {
  const numericValue = value.replace(/,/g, "");
  return parseFloat(numericValue) || 0;
};

export const calculateVAT = (
  amount: number,
  vatStatus: "vat-included" | "vat-excluded"
) => {
  if (vatStatus === "vat-excluded") return 0;
  return Math.round(amount * 0.1);
};

export const calculateTotalAmount = (baseAmount: number, vat: number) => {
  return baseAmount + vat;
};

export const calculateTotalCalculation = (financialInfo: {
  totalBrokerageFee: number;
  totalRebate: number;
  totalSupportAmount: number;
}) => {
  return (
    financialInfo.totalBrokerageFee +
    financialInfo.totalRebate -
    financialInfo.totalSupportAmount
  );
};
