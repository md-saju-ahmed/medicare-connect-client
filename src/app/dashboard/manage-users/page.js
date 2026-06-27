"use client";
import AdminUsersPage from "@/features/admin/AdminUsersPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function ManageUsersPage() {
  const { allowed } = useRoleGuard(["admin"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="Manage Users" />
      <AdminUsersPage />
    </>
  );
}
