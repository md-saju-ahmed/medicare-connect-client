"use client";
import DoctorPrescriptionsPage from "@/features/doctor/DoctorPrescriptionsPage";
import PatientPrescriptionsPage from "@/features/patient/PatientPrescriptionsPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function PrescriptionsPage() {
  const { role, allowed } = useRoleGuard(["doctor", "patient"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle
        title={role === "doctor" ? "Manage Prescriptions" : "My Prescriptions"}
      />
      {role === "doctor" && <DoctorPrescriptionsPage />}
      {role === "patient" && <PatientPrescriptionsPage />}
    </>
  );
}
