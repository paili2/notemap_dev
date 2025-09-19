"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import {
  Users,
  FileText,
  Bell,
  BarChart3,
  TrendingUp,
  Activity,
  Heart,
} from "lucide-react";
import Link from "next/link";

export function AdminMainPage() {
  const quickActions = [
    {
      title: "직원 관리",
      description: "직원 정보 조회 및 관리",
      href: "/admin/employees",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "직원즐겨찾기",
      description: "즐겨찾기한 직원 관리",
      href: "/admin/employee-favorites",
      icon: Heart,
      color: "bg-pink-500",
    },
    {
      title: "계약 관리",
      description: "계약서 및 거래 관리",
      href: "/admin/contracts",
      icon: FileText,
      color: "bg-green-500",
    },
    {
      title: "공지사항",
      description: "사이트 공지사항 관리",
      href: "/admin/notices",
      icon: Bell,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8 bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="mt-6 p-6">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-16">
            관리자 페이지
          </h1>
        </div>

        {/* 빠른 작업 */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="bg-white hover:shadow-lg transition-all duration-200 cursor-pointer aspect-square">
                  <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-xl ${action.color} mb-4`}>
                      <action.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
