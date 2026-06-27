"use client";
import AdminAppointmentsPage from "@/features/admin/AdminAppointmentsPage";
import DoctorAppointmentsPage from "@/features/doctor/DoctorAppointmentsPage";
import PatientAppointmentsPage from "@/features/patient/PatientAppointmentsPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

// Every known role can view this page, so there's no "not allowed" redirect —
// but an unrecognized role will be redirected home rather than shown blank.
export default function AppointmentsPage() {
  const { role, isAdmin, allowed } = useRoleGuard([
    "admin",
    "doctor",
    "patient",
  ]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="Appointments" />
      {isAdmin && <AdminAppointmentsPage />}
      {role === "doctor" && <DoctorAppointmentsPage />}
      {role === "patient" && <PatientAppointmentsPage />}
    </>
  );
}
