import { AdminLayout } from "@/features/admin/components/AdminLayout";
import UserSettingsPage from "@/features/users/pages/UserSettingsPage";

const EmployeesPage = () => {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <UserSettingsPage />
      </div>
    </AdminLayout>
  );
};

export default EmployeesPage;
