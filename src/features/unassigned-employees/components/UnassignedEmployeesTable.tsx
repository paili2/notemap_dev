"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Table } from "@/features/table/components/Table";
import { TableColumn } from "@/features/table/types/table";
import { UnassignedEmployee } from "../types/unassignedEmployee";

interface UnassignedEmployeesTableProps {
  employees: UnassignedEmployee[];
  onAddToTeam: (employeeId: string) => void;
}

export function UnassignedEmployeesTable({
  employees,
  onAddToTeam,
}: UnassignedEmployeesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 페이지네이션 계산
  const pagination = useMemo(() => {
    const totalPages = Math.ceil(employees.length / itemsPerPage);
    return {
      currentPage,
      totalPages,
      totalLists: employees.length,
      listsPerPage: itemsPerPage,
    };
  }, [employees.length, currentPage]);

  // 현재 페이지 데이터
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return employees.slice(startIndex, endIndex);
  }, [employees, currentPage]);
  const columns: TableColumn<UnassignedEmployee>[] = [
    {
      key: "name",
      label: "이름",
      width: "40%",
      align: "left",
      render: (value) => <span className="whitespace-nowrap">{value}</span>,
    },
    {
      key: "phone",
      label: "연락처",
      width: "45%",
      align: "left",
      render: (value) => <span className="whitespace-nowrap">{value}</span>,
    },
    {
      key: "actions",
      label: "추가",
      width: "15%",
      align: "left",
      render: (_, row) => (
        <Button
          size="sm"
          onClick={() => onAddToTeam(row.id)}
          className="bg-primary hover:bg-primary/90"
        >
          팀원 추가
        </Button>
      ),
    },
  ];

  return (
    <Table
      data={paginatedData}
      columns={columns}
      pagination={pagination}
      onPageChange={setCurrentPage}
      emptyMessage="팀에 소속되지 않은 직원이 없습니다."
    />
  );
}
