import { Card, CardContent } from "@/components/atoms/Card/Card";
import { TrendingUp, DollarSign, Users } from "lucide-react";

interface StatsCardsProps {
  totalContracts: number;
  totalAllowance: number;
  totalEmployees: number;
}

export function StatsCards({
  totalContracts,
  totalAllowance,
  totalEmployees,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 계약 건수</p>
              <p className="text-2xl font-bold">{totalContracts}건</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 최종수당</p>
              <p className="text-2xl font-bold">
                {(totalAllowance / 10000).toLocaleString()}만원
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 직원 수</p>
              <div className="text-2xl font-bold">{totalEmployees}명</div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
