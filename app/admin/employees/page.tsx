import { DefaultLayout } from "@/components/layouts/DefaultLayout/DefaultLayout";
import UserSettingsPage from "@/features/users/pages/UserSettingsPage";

const EmployeesPage = () => {
  return (
    <DefaultLayout>
      <UserSettingsPage />
    </DefaultLayout>
  );
};

export default EmployeesPage;
