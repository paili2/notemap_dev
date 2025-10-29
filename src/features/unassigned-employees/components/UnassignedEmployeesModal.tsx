"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog/Dialog";
import { UnassignedEmployeesTable } from "./UnassignedEmployeesTable";
import { useUnassignedEmployees } from "../hooks/useUnassignedEmployees";

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
  const { data: employees = [], isLoading, error } = useUnassignedEmployees();

  const handleAddToTeam = (employeeId: string) => {
    // 상위 컴포넌트에 알림
    if (onAddToTeam) {
      onAddToTeam(employeeId);
    }
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  무소속 직원 목록을 불러오는 중...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              무소속 직원 목록을 불러올 수 없습니다.
            </div>
          ) : (
            <UnassignedEmployeesTable
              employees={employees}
              onAddToTeam={handleAddToTeam}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
