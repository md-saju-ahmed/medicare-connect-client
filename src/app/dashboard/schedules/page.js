"use client";
import DoctorSchedulesPage from "@/features/doctor/DoctorSchedulesPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function SchedulesPage() {
  const { allowed } = useRoleGuard(["doctor"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="Manage Schedules" />
      <DoctorSchedulesPage />
    </>
  );
}
