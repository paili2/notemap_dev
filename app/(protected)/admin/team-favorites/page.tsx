"use client";

import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

const TeamFavoritesPage = () => {
  return (
    <AdminAuthGuard>
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">팀즐겨찾기</h1>
        <p>API 없음(진행예정)</p>
      </div>
    </AdminAuthGuard>
  );
};

export default TeamFavoritesPage;
