"use client";
import DoctorProfilePage from "@/features/doctor/DoctorProfilePage";
import PatientProfilePage from "@/features/patient/PatientProfilePage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function ProfilePage() {
  const { role, allowed } = useRoleGuard(["doctor", "patient"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="My Profile" />
      {role === "doctor" && <DoctorProfilePage />}
      {role === "patient" && <PatientProfilePage />}
    </>
  );
}
