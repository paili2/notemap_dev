import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { AdminMainPage } from "@/features/admin/components/AdminMainPage";

const AdminPage = () => {
  return (
    <AdminLayout>
      <AdminMainPage />
    </AdminLayout>
  );
};

export default AdminPage;
