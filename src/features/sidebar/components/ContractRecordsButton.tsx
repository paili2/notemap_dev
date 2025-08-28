"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent } from "@/components/atoms/Card/Card";

interface ContractRecordsButtonProps {
  onClick: () => void;
}

export function ContractRecordsButton({ onClick }: ContractRecordsButtonProps) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200 bg-transparent"
          onClick={onClick}
        >
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">영업자 계약기록</span>
        </Button>
      </CardContent>
    </Card>
  );
}
