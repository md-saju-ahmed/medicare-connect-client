"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardContext } from "@/app/dashboard/DashboardContext";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export function useRoleGuard(allowedRoles, redirectTo = "/dashboard") {
  const { user, loading } = useDashboardContext();
  const router = useRouter();

  const role = user?.role ?? null;
  const isAdmin = role !== null && ADMIN_ROLES.has(role);
  const isAllowed =
    allowedRoles === "any" ||
    (role !== null &&
      allowedRoles.some((allowed) =>
        allowed === "admin" ? isAdmin : allowed === role,
      ));

  useEffect(() => {
    if (loading || allowedRoles === "any") return;
    if (!isAllowed) router.replace(redirectTo);
  }, [loading, isAllowed, allowedRoles, redirectTo, router]);

  return {
    role,
    isAdmin,
    loading,
    allowed: !loading && (allowedRoles === "any" ? role !== null : isAllowed),
  };
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-64 rounded-xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
