"use client";
import { useEffect, useState, useMemo } from "react";
import { CalendarDays, Star, Users, MessageSquare, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/admin-utils";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

function getTodayString() {
  return format(new Date(), "yyyy-MM-dd");
}

const APPT_STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-600",
  accepted: "bg-sky-500/10 text-sky-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  rescheduled: "bg-violet-500/10 text-violet-600",
};

export default function DoctorDashboard() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading || !session?.user) return;

    const controller = new AbortController();

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const { data: jwtData } = await authClient.token();
        const token = jwtData?.token;
        if (!token) throw new Error("No authentication token available");

        const headers = { Authorization: `Bearer ${token}` };

        const userRes = await fetch(`${API_BASE}/users/me`, {
          signal: controller.signal,
          credentials: "include",
          headers: { ...headers, "Content-Type": "application/json" },
        });
        if (!userRes.ok) {
          const err = await userRes.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${userRes.status}`);
        }
        const userData = await userRes.json();

        const doctorRes = await fetch(`${API_BASE}/doctors/me`, {
          signal: controller.signal,
          headers,
        });
        if (!doctorRes.ok) {
          const err = await doctorRes.json().catch(() => ({}));
          throw new Error(err.message || "Doctor profile not found");
        }
        const doctorProfile = await doctorRes.json();

        const doctorId = doctorProfile._id;

        const [appointmentRes, reviewRes] = await Promise.all([
          fetch(`${API_BASE}/appointments?doctorId=${doctorId}`, {
            signal: controller.signal,
            headers,
          }),
          fetch(`${API_BASE}/reviews?doctorId=${doctorId}`, {
            signal: controller.signal,
            headers,
          }),
        ]);

        const [appointmentData, reviewData] = await Promise.all([
          appointmentRes.json(),
          reviewRes.json(),
        ]);

        const appointments = Array.isArray(appointmentData)
          ? appointmentData
          : [];
        const reviews = Array.isArray(reviewData) ? reviewData : [];

        const uniquePatientIds = [
          ...new Set(reviews.map((r) => r.patientId).filter(Boolean)),
        ];

        const patientDataMap = {};
        await Promise.all(
          uniquePatientIds.map(async (patientId) => {
            try {
              const res = await fetch(`${API_BASE}/users/${patientId}`, {
                signal: controller.signal,
                headers,
              });
              if (res.ok) {
                patientDataMap[patientId] = await res.json();
              }
            } catch {
              // silently skip — fallback values are used in render
            }
          }),
        );

        setDashboardData({
          user: userData,
          doctorProfile,
          appointments,
          reviews,
          patientDataMap,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load dashboard data");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => controller.abort();
  }, [session?.user?.id, sessionLoading]);

  const user = dashboardData?.user;
  const doctorProfile = dashboardData?.doctorProfile;
  const appointments = useMemo(
    () => dashboardData?.appointments ?? [],
    [dashboardData?.appointments],
  );
  const reviews = useMemo(
    () => dashboardData?.reviews ?? [],
    [dashboardData?.reviews],
  );
  const patientDataMap = dashboardData?.patientDataMap ?? {};

  const isLoading = sessionLoading || loading;

  const { distinctPatients, pendingRequests, rating } = useMemo(() => {
    return {
      distinctPatients: new Set(
        appointments.map((a) => a.patientId).filter(Boolean),
      ).size,
      pendingRequests: appointments.filter(
        (a) => a.appointmentStatus === "pending",
      ).length,
      rating: doctorProfile?.rating ?? user?.rating ?? 0,
    };
  }, [appointments, doctorProfile, user]);

  const todaysAppointments = useMemo(() => {
    const today = getTodayString();
    return appointments
      .filter((a) => a.appointmentDate === today)
      .sort((a, b) =>
        (a.appointmentTime ?? "").localeCompare(b.appointmentTime ?? ""),
      );
  }, [appointments]);

  const recentReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [reviews]);

  const stats = useMemo(() => {
    return [
      {
        title: "Patients",
        value: distinctPatients.toLocaleString(),
        icon: Users,
      },
      {
        title: "Pending",
        value: pendingRequests.toLocaleString(),
        icon: CalendarDays,
      },
      {
        title: "Score",
        value: typeof rating === "number" ? rating.toFixed(1) : rating || "N/A",
        icon: Star,
      },
      {
        title: "Feedbacks",
        value: reviews.length.toLocaleString(),
        icon: MessageSquare,
      },
    ];
  }, [distinctPatients, pendingRequests, rating, reviews.length]);

  if (!sessionLoading && !session?.user) {
    return (
      <div className="flex items-center justify-center text-muted-foreground py-20">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Access Denied</p>
          <p>You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-20">
        <div className="bg-destructive/10 p-6 rounded-2xl max-w-md">
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load dashboard
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const lastName = (user?.name ?? session?.user?.name ?? "").split(" ").pop();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">
                  Welcome back{lastName ? `, Dr. ${lastName}` : ""}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here&apos;s your practice overview for today
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl border-none shadow-xs ring-0 p-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300 ring-0 p-0 border-none overflow-hidden">
                    <CardContent className="p-5 flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-bold leading-none">
                          {item.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.title}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300 border-none ring-0 p-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">
                Today&apos;s Appointments
              </h2>
              <p className="text-muted-foreground text-sm">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-xl border px-5 py-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            ) : todaysAppointments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No appointments scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysAppointments.map((appt) => {
                  const status = appt.appointmentStatus;
                  return (
                    <div
                      key={appt._id}
                      className="flex items-center justify-between gap-4 rounded-xl border px-5 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {appt.patientName ||
                              `Patient #${String(appt.patientId || "").slice(
                                -6,
                              )}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appt.appointmentTime || "Time not set"}
                            {appt.reason ? ` · ${appt.reason}` : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          APPT_STATUS_STYLES[status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status
                          ? status.charAt(0).toUpperCase() + status.slice(1)
                          : "Unknown"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300 border-none ring-0 p-0">
          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold">
                Patient Testimonials
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Recent feedback from your patients
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-2xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-14" />
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Skeleton key={j} className="h-4 w-4 rounded-sm" />
                        ))}
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review, i) => {
                  const comment =
                    review.reviewText ??
                    review.comment ??
                    review.feedback ??
                    review.review ??
                    "";

                  const patientInfo = patientDataMap[review.patientId];
                  const patientName =
                    review.patientName ??
                    patientInfo?.name ??
                    review.patient?.name ??
                    "Patient";
                  const patientImage =
                    review.patientImage ??
                    patientInfo?.image ??
                    review.patient?.image ??
                    "";

                  const starRating = review.rating ?? 0;

                  return (
                    <div
                      key={review._id ?? i}
                      className="border rounded-2xl p-6 bg-linear-to-br from-background to-muted/30"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              {patientImage && (
                                <AvatarImage
                                  src={patientImage}
                                  alt={patientName}
                                />
                              )}
                              <AvatarFallback>
                                {getInitials(patientName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-base">
                                {patientName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Patient
                              </p>
                            </div>
                          </div>
                          {comment && (
                            <p className="text-muted-foreground italic leading-relaxed">
                              &ldquo;{comment}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              size={18}
                              className={
                                idx < starRating
                                  ? "text-yellow-400"
                                  : "text-muted-foreground/20"
                              }
                              fill={idx < starRating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
