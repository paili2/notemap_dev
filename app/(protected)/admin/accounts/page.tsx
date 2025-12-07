"use client";

import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";
import AccountsPage from "@/features/admin/pages/AccountsPage";

const AdminAccountsPage = () => {
  return (
    <AdminAuthGuard>
      <AccountsPage />
    </AdminAuthGuard>
  );
};

export default AdminAccountsPage;

