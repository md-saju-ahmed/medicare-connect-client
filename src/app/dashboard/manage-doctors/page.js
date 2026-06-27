"use client";
import AdminDoctorsPage from "@/features/admin/AdminDoctorsPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function ManageDoctorsPage() {
  const { allowed } = useRoleGuard(["admin"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="Manage Doctors" />
      <AdminDoctorsPage />
    </>
  );
}
