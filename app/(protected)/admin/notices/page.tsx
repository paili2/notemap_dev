"use client";

import { NoticesPage } from "@/features/admin/pages/NoticesPage";
import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

const NoticesPageRoute = () => {
  return (
    <AdminAuthGuard>
      <NoticesPage />
    </AdminAuthGuard>
  );
};

export default NoticesPageRoute;
