"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken, buildHeaders, toArray } from "@/lib/admin-utils";
import { useDashboardContext } from "@/app/dashboard/DashboardContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function AdminDashboard() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { user } = useDashboardContext();

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

        const token = await fetchAuthToken();
        const headers = buildHeaders(token);

        const [statsRes, usersRes, doctorsRes, appointmentsRes, paymentsRes] =
          await Promise.all([
            fetch(`${API_BASE}/stats`, { signal: controller.signal, headers }),
            fetch(`${API_BASE}/users`, { signal: controller.signal, headers }),
            fetch(`${API_BASE}/doctors/all`, {
              signal: controller.signal,
              headers,
            }),
            fetch(`${API_BASE}/appointments`, {
              signal: controller.signal,
              headers,
            }),
            fetch(`${API_BASE}/payments`, {
              signal: controller.signal,
              headers,
            }),
          ]);

        const statsData = await statsRes.json().catch(() => ({}));
        const usersData = await usersRes.json().catch(() => []);
        const doctorsData = await doctorsRes.json().catch(() => ({}));
        const appointmentsData = await appointmentsRes.json().catch(() => []);
        const paymentsData = await paymentsRes.json().catch(() => []);

        setDashboardData({
          stats: statsData,
          users: toArray(usersData, "users"),
          doctors: toArray(doctorsData, "doctors"),
          appointments: toArray(appointmentsData, "appointments"),
          payments: toArray(paymentsData, "payments"),
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    return () => controller.abort();
  }, [session?.user?.id, sessionLoading]);

  const { users, doctors, appointments, payments, stats } = useMemo(() => {
    return {
      users: dashboardData?.users || [],
      doctors: dashboardData?.doctors || [],
      appointments: dashboardData?.appointments || [],
      payments: dashboardData?.payments || [],
      stats: dashboardData?.stats || {},
    };
  }, [dashboardData]);

  const statsCards = useMemo(() => {
    if (!dashboardData) return null;

    const totalPatients = users.filter((u) => u.role === "patient").length;
    const verifiedClinicians = doctors.filter(
      (d) => d.status === "verified" || d.verificationStatus === "verified",
    ).length;
    const allBookings = appointments.length || stats.totalAppointments || 0;
    const grossCoPays = payments
      .reduce((sum, p) => sum + (p.amount || p.coPay || 0), 0)
      .toLocaleString("en-US", { style: "currency", currency: "USD" });

    return [
      {
        title: "Total Patients",
        value: totalPatients.toLocaleString(),
        icon: Users,
        color: "bg-blue-500/10",
        iconColor: "text-blue-500",
      },
      {
        title: "Verified Clinicians",
        value: verifiedClinicians.toLocaleString(),
        icon: Stethoscope,
        color: "bg-green-500/10",
        iconColor: "text-green-500",
      },
      {
        title: "All Bookings",
        value: allBookings.toLocaleString(),
        icon: CalendarCheck,
        color: "bg-purple-500/10",
        iconColor: "text-purple-500",
      },
      {
        title: "Gross Co-Pays",
        value: grossCoPays,
        icon: DollarSign,
        color: "bg-yellow-500/10",
        iconColor: "text-yellow-500",
      },
    ];
  }, [users, doctors, appointments, payments, stats, dashboardData]);

  const clinicianPerformanceData = useMemo(() => {
    return [...doctors]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8)
      .map((doctor) => ({
        name: (doctor.doctorName || "Unknown").split(" ").pop(),
        rating: doctor.rating || 0,
        fullName: doctor.doctorName || "Unknown",
      }));
  }, [doctors]);

  const appointmentTimelineData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return { dateStr: format(date, "yyyy-MM-dd"), dateObj: date };
    });

    return last7Days.map(({ dateStr, dateObj }) => {
      const count = appointments.filter((a) => {
        const aptDate =
          a.appointmentDate?.split("T")[0] || a.date?.split("T")[0];
        return aptDate === dateStr;
      }).length;
      return {
        date: format(dateObj, "EEE, MMM d"),
        appointments: count,
      };
    });
  }, [appointments]);

  const specialtyBreakdownData = useMemo(() => {
    const breakdown = doctors.reduce((acc, doc) => {
      const spec = doc.specialization || "General";
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [doctors]);

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

  const firstName = (user?.name ?? "").split(" ")[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">
                  Welcome back{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here&apos;s your ecosystem overview for today
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading || !statsCards
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
          : statsCards.map((item, index) => {
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
                      <div
                        className={`h-11 w-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={18} className={item.iconColor} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Star size={20} className="text-yellow-500" />
                <h2 className="text-lg font-bold">
                  Clinician Performance Index
                </h2>
              </div>
              {loading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : clinicianPerformanceData.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <AlertCircle size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No clinician data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={clinicianPerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value} / 5`, "Rating"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullName || label
                      }
                    />
                    <Bar
                      dataKey="rating"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={35}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-primary" />
                <h2 className="text-lg font-bold">Appointment Timeline</h2>
              </div>
              {loading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : appointmentTimelineData.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <AlertCircle size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No appointment data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={appointmentTimelineData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Stethoscope size={20} className="text-primary" />
                <h2 className="text-lg font-bold">
                  Ecosystem Specialty Breakdown
                </h2>
              </div>
              <Link
                href="/dashboard/manage-doctors"
                className="text-primary font-medium text-sm hover:underline"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : specialtyBreakdownData.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertCircle size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No specialty data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={specialtyBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {specialtyBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {specialtyBreakdownData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
