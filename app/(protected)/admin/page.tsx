"use client";

import { AdminMainPage } from "@/features/admin/components/AdminMainPage";
import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

const AdminPage = () => {
  return (
    <AdminAuthGuard>
      <AdminMainPage />
    </AdminAuthGuard>
  );
};

export default AdminPage;
