export const formatCurrency = (amount: number): string => {
  // NaN이나 undefined인 경우 0으로
  if (isNaN(amount) || amount === undefined || amount === null) {
    return "0";
  }
  return new Intl.NumberFormat("ko-KR").format(amount);
};

export const calculateVAT = (
  amount: number,
  taxStatus: "taxable" | "tax-free"
) => {
  if (taxStatus === "tax-free") return 0;
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
    financialInfo.totalBrokerageFee -
    financialInfo.totalRebate +
    financialInfo.totalSupportAmount
  );
};
