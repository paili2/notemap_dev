import { AdminLayout } from "@/features/admin/components/AdminLayout";

const NoticesPage = () => {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">공지사항</h1>
      </div>
    </AdminLayout>
  );
};

export default NoticesPage;
