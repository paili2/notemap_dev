import React from "react";
import type { TableColumn } from "@/features/table/types/table";
import type { ContractData } from "../types";
import { statusConfigMap, formatCurrency, formatDate } from "./contractUtils";

// 테이블 컬럼 설정
export const contractTableColumns: TableColumn<ContractData>[] = [
  {
    key: "contractNumber",
    label: "계약번호",
    width: "140px",
    align: "center",
    render: (value) => <div className="font-medium text-blue-600">{value}</div>,
  },
  {
    key: "customerName",
    label: "고객명",
    width: "100px",
    align: "center",
  },
  {
    key: "customerContact",
    label: "연락처",
    width: "130px",
    align: "center",
  },
  {
    key: "salesPerson",
    label: "담당자",
    width: "100px",
    align: "center",
  },
  {
    key: "totalCalculation",
    label: "계약금액",
    width: "120px",
    align: "center",
    render: (value) => (
      <div className="font-medium">{formatCurrency(value)}</div>
    ),
  },
  {
    key: "contractDate",
    label: "계약일",
    width: "110px",
    align: "center",
    render: (value) => formatDate(value),
  },
  {
    key: "status",
    label: "상태",
    width: "80px",
    align: "center",
    render: (value) => {
      const config = statusConfigMap[value as keyof typeof statusConfigMap];
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
      );
    },
  },
];

// 검색 키 설정
export const searchKeys = ["contractNumber", "customerName", "salesPerson"];

// 페이지네이션 설정
export const paginationConfig = {
  listsPerPage: 10,
} as const;
