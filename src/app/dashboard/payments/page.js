"use client";
import AdminPaymentsPage from "@/features/admin/AdminPaymentsPage";
import PatientPaymentsPage from "@/features/patient/PatientPaymentsPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function PaymentsPage() {
  const { role, isAdmin, allowed } = useRoleGuard(["admin", "patient"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="Payments" />
      {isAdmin && <AdminPaymentsPage />}
      {role === "patient" && <PatientPaymentsPage />}
    </>
  );
}
