"use client";
import PatientReviewPage from "@/features/patient/PatientReviewPage";
import PageTitle from "@/components/shared/PageTitle";
import {
  useRoleGuard,
  DashboardPageSkeleton,
} from "@/app/dashboard/useRoleGuard";

export default function ReviewsPage() {
  const { allowed } = useRoleGuard(["patient"]);

  if (!allowed) return <DashboardPageSkeleton />;

  return (
    <>
      <PageTitle title="Manage Reviews" />
      <PatientReviewPage />
    </>
  );
}
