"use client";
import AdminDashboard from "@/features/admin/AdminDashboard";
import DoctorDashboard from "@/features/doctor/DoctorDashboard";
import PatientDashboard from "@/features/patient/PatientDashboard";
import { useDashboardContext } from "@/app/dashboard/DashboardContext";
import PageTitle from "@/components/shared/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_TITLES = {
  admin: "Admin Dashboard",
  super_admin: "Admin Dashboard",
  doctor: "Doctor Dashboard",
  patient: "Patient Dashboard",
};

const ROLE_DASHBOARDS = {
  admin: AdminDashboard,
  super_admin: AdminDashboard,
  doctor: DoctorDashboard,
  patient: PatientDashboard,
};

export default function DashboardPage() {
  const { user, loading } = useDashboardContext();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const role = user?.role;
  const title = ROLE_TITLES[role] ?? "Dashboard";
  const DashboardComponent = ROLE_DASHBOARDS[role];

  if (!DashboardComponent) {
    return (
      <>
        <PageTitle title={title} />
        <div className="flex items-center justify-center text-muted-foreground py-20">
          <p>
            Unable to determine your dashboard view. Please contact support.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title={title} />
      <DashboardComponent />
    </>
  );
}
