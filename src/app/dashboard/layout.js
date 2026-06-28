"use client";
import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HeartPulse,
  Users,
  Stethoscope,
  CalendarCheck,
  CalendarDays,
  DollarSign,
  Receipt,
  Clock,
  FileText,
  UserRound,
  Star,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Container from "@/components/shared/Container";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken, buildHeaders } from "@/lib/admin-utils";
import {
  DashboardProvider,
  useDashboardContext,
} from "@/app/dashboard/DashboardContext";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const ADMIN_MENU = [
  {
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    href: "/dashboard",
    exact: true,
  },
  { title: "Manage Users", icon: Users, href: "/dashboard/manage-users" },
  {
    title: "Manage Doctors",
    icon: Stethoscope,
    href: "/dashboard/manage-doctors",
  },
  {
    title: "Appointments Registry",
    icon: CalendarCheck,
    href: "/dashboard/appointments",
  },
  { title: "Cash Flows", icon: DollarSign, href: "/dashboard/payments" },
];

const DOCTOR_MENU = [
  {
    title: "Dashboard Overview",
    icon: HeartPulse,
    href: "/dashboard",
    exact: true,
  },
  { title: "Manage Schedules", icon: Clock, href: "/dashboard/schedules" },
  {
    title: "Appointment Requests",
    icon: CalendarDays,
    href: "/dashboard/appointments",
  },
  {
    title: "Prescription Management",
    icon: FileText,
    href: "/dashboard/prescriptions",
  },
  { title: "Profile Management", icon: UserRound, href: "/dashboard/profile" },
];

const PATIENT_MENU = [
  {
    title: "Dashboard Overview",
    icon: HeartPulse,
    href: "/dashboard",
    exact: true,
  },
  {
    title: "My Appointments",
    icon: CalendarDays,
    href: "/dashboard/appointments",
  },
  { title: "Payment History", icon: Receipt, href: "/dashboard/payments" },
  {
    title: "My Prescriptions",
    icon: FileText,
    href: "/dashboard/prescriptions",
  },
  { title: "My Reviews", icon: Star, href: "/dashboard/reviews" },
  { title: "Profile Management", icon: UserRound, href: "/dashboard/profile" },
];

function menuForRole(role) {
  if (role === "admin" || role === "super_admin") return ADMIN_MENU;
  if (role === "doctor") return DOCTOR_MENU;
  return PATIENT_MENU;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SidebarProfile({ user, doctorProfile, loading }) {
  if (loading || !user) {
    return (
      <div className="flex items-center gap-3 pb-5 border-b">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  const role = user?.role ?? "";
  const name = user?.name ?? "";
  const image = user?.image ?? "";
  const isAdmin = role === "admin" || role === "super_admin";
  const isDoctor = role === "doctor";

  return (
    <div className="flex items-center gap-4 pb-6 border-b">
      <div className="relative shrink-0">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2">
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback className="text-base font-semibold bg-primary/10">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 className="font-bold text-base truncate">{name || "—"}</h2>
          {isAdmin && (
            <ShieldCheck size={16} className="text-primary shrink-0" />
          )}
          {isDoctor && doctorProfile?.verificationStatus === "verified" && (
            <BadgeCheck size={16} className="text-primary shrink-0" />
          )}
        </div>

        {isAdmin ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
            {role.replace("_", " ")}
          </span>
        ) : (
          <Badge className="text-xs font-normal mt-1 capitalize">
            {role || "—"}
          </Badge>
        )}
      </div>
    </div>
  );
}

function DashboardContent({ children }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const pathname = usePathname();

  const {
    user,
    setUser,
    doctorProfile,
    setDoctorProfile,
    loading,
    setLoading,
    error,
    setError,
  } = useDashboardContext();

  // Tracks the last successfully loaded id:role:status combo to avoid
  // redundant fetches while still reacting to session changes (e.g. role change, ban).
  const loadedFingerprintRef = useRef(null);

  const fetchProfile = useCallback(
    async (fingerprint, signal) => {
      try {
        setLoading(true);
        setError(null);

        const token = await fetchAuthToken();
        const headers = buildHeaders(token);

        const userRes = await fetch(`${API_BASE}/users/me`, {
          signal,
          credentials: "include",
          headers,
        });

        if (!userRes.ok) {
          const errData = await userRes.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP ${userRes.status}`);
        }

        const userData = await userRes.json();

        if (userData.role === "doctor") {
          const doctorRes = await fetch(`${API_BASE}/doctors/me`, {
            signal,
            credentials: "include",
            headers,
          });
          if (!doctorRes.ok) {
            const errData = await doctorRes.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${doctorRes.status}`);
          }
          setDoctorProfile(await doctorRes.json());
        }

        setUser(userData);
        loadedFingerprintRef.current = fingerprint;
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser, setDoctorProfile],
  );

  const sessionUser = session?.user;
  const sessionFingerprint = sessionUser
    ? `${sessionUser.id}:${sessionUser.role ?? ""}:${sessionUser.status ?? ""}`
    : null;

  useEffect(() => {
    if (sessionLoading || !sessionFingerprint) return;
    if (loadedFingerprintRef.current === sessionFingerprint) return;

    const controller = new AbortController();
    fetchProfile(sessionFingerprint, controller.signal);

    return () => controller.abort();
  }, [sessionFingerprint, sessionLoading, fetchProfile]);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-center px-4">
        <div className="bg-destructive/10 p-6 rounded-2xl max-w-md">
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load dashboard
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => {
              loadedFingerprintRef.current = null;
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const role = !loading && user ? user.role : null;
  const menuItems = role ? menuForRole(role) : [];

  return (
    <div className="min-h-screen bg-background py-15 md:py-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-2xl shadow-xs p-6 backdrop-blur-sm h-fit lg:sticky lg:top-8"
          >
            <SidebarProfile
              user={user}
              doctorProfile={doctorProfile}
              loading={loading}
            />

            <nav className="mt-6 space-y-2" aria-label="Dashboard navigation">
              {!role
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-lg" />
                  ))
                : menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <motion.div
                        key={item.href}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all duration-200 ${
                            active
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon size={19} className="shrink-0" />
                          <span className="font-medium text-sm">
                            {item.title}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
            </nav>
          </motion.aside>

          <main className="space-y-6 min-w-0">{children}</main>
        </div>
      </Container>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
