"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog/Dialog";
import { UnassignedEmployeesTable } from "./UnassignedEmployeesTable";
import { MOCK_UNASSIGNED_EMPLOYEES } from "../_mock";
import { UnassignedEmployee } from "../types/unassignedEmployee";

interface UnassignedEmployeesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToTeam?: (employeeId: string) => void;
}

export function UnassignedEmployeesModal({
  open,
  onOpenChange,
  onAddToTeam,
}: UnassignedEmployeesModalProps) {
  const [employees, setEmployees] = useState<UnassignedEmployee[]>(
    MOCK_UNASSIGNED_EMPLOYEES
  );

  const handleAddToTeam = (employeeId: string) => {
    // 팀에 추가 후 목록에서 제거
    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));

    // 상위 컴포넌트에 알림
    if (onAddToTeam) {
      onAddToTeam(employeeId);
    }

    // TODO: API 연동
    console.log("팀에 추가:", employeeId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>팀원 추가</DialogTitle>
          <DialogDescription>
            팀에 소속되지 않은 직원을 팀에 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <UnassignedEmployeesTable
            employees={employees}
            onAddToTeam={handleAddToTeam}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
