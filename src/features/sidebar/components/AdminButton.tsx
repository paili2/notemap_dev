"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent } from "@/components/atoms/Card/Card";
import Link from "next/link";

interface AdminButtonProps {
  onClick?: () => void;
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="p-2">
        <Link href="/admin">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200 bg-transparent"
            onClick={onClick}
          >
            <Settings className="h-4 w-4" />
            <span className="text-base font-medium">관리자 페이지</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
