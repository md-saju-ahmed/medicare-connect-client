"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays, History, DollarSign, Heart, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardContext } from "@/app/dashboard/DashboardContext";
import { fetchAuthToken, toArray } from "@/lib/admin-utils";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const formatAppointmentDate = (dateString) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "EEE, MMM d, yyyy");
  } catch {
    return dateString;
  }
};

const STATUS_BADGE_MAP = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  accepted: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  rescheduled: {
    label: "Rescheduled",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
};

const getStatusBadge = (status) =>
  STATUS_BADGE_MAP[status] || { label: status, className: "" };

const isPatientMatch = (item, patientId) =>
  item.patientId === patientId ||
  item.patientId?._id === patientId ||
  item.patient?._id === patientId;

const resolveDoctorId = (doctorId) =>
  typeof doctorId === "object" ? doctorId?._id || doctorId?.id : doctorId;

export default function PatientDashboard() {
  const { user, loading: contextLoading } = useDashboardContext();

  const [appointments, setAppointments] = useState(null);
  const [payments, setPayments] = useState(null);
  const [doctorNames, setDoctorNames] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const doctorCacheRef = useRef({});

  const patientId = user?._id || user?.id;

  useEffect(() => {
    if (contextLoading) return;
    if (!patientId) {
      setDataLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchPatientData() {
      try {
        setDataLoading(true);
        setError(null);

        const token = await fetchAuthToken();
        const authHeader = { Authorization: `Bearer ${token}` };

        const [appointmentRes, paymentRes] = await Promise.all([
          fetch(`${API_BASE}/appointments`, {
            signal: controller.signal,
            headers: authHeader,
          }),
          fetch(`${API_BASE}/payments`, {
            signal: controller.signal,
            headers: authHeader,
          }),
        ]);

        let patientAppointments = [];

        if (appointmentRes.ok) {
          const data = await appointmentRes.json();
          const all = toArray(data, "appointments");
          patientAppointments = all.filter((a) => isPatientMatch(a, patientId));
          setAppointments(patientAppointments);
        } else {
          setAppointments([]);
        }

        if (paymentRes.ok) {
          const data = await paymentRes.json();
          const all = toArray(data, "payments");
          setPayments(all.filter((p) => isPatientMatch(p, patientId)));
        } else {
          setPayments([]);
        }

        const missingIds = [
          ...new Set(
            patientAppointments
              .filter((a) => !a.doctorName && !a.doctor?.doctorName)
              .map((a) => resolveDoctorId(a.doctorId))
              .filter(Boolean)
              .filter((id) => !doctorCacheRef.current[id]),
          ),
        ];

        if (missingIds.length > 0) {
          const results = await Promise.allSettled(
            missingIds.map((id) =>
              fetch(`${API_BASE}/doctors/${id}`, {
                signal: controller.signal,
                headers: authHeader,
              }).then((r) => (r.ok ? r.json() : null)),
            ),
          );

          const newNames = {};

          results.forEach((result, i) => {
            if (result.status === "fulfilled" && result.value) {
              const doc = result.value;
              const name = doc.doctorName || doc.name || "Doctor";
              doctorCacheRef.current[missingIds[i]] = name;
              newNames[missingIds[i]] = name;
            }
          });

          if (Object.keys(newNames).length > 0) {
            setDoctorNames((prev) => ({ ...prev, ...newNames }));
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Patient dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setDataLoading(false);
      }
    }

    fetchPatientData();
    return () => controller.abort();
  }, [patientId, contextLoading]);

  const getDoctorName = (appointment) => {
    if (appointment.doctorName) return appointment.doctorName;
    if (appointment.doctor?.doctorName) return appointment.doctor.doctorName;
    const id = resolveDoctorId(appointment.doctorId);
    return doctorNames[id] ?? "Doctor";
  };

  const loading = contextLoading || dataLoading;

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
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats =
    !loading && appointments !== null
      ? [
          {
            title: "Upcoming Appointments",
            value: appointments
              .filter(
                (a) =>
                  a.appointmentStatus === "confirmed" ||
                  a.appointmentStatus === "accepted",
              )
              .length.toLocaleString(),
            icon: CalendarDays,
          },
          {
            title: "Appointment History",
            value: appointments
              .filter((a) => a.appointmentStatus === "completed")
              .length.toLocaleString(),
            icon: History,
          },
          {
            title: "Total Payments",
            value: (payments ?? []).length.toLocaleString(),
            icon: DollarSign,
          },
          {
            title: "Saved Doctors",
            value: new Set(
              appointments
                .filter((a) => a.doctorId)
                .map((a) => resolveDoctorId(a.doctorId)),
            ).size.toLocaleString(),
            icon: Heart,
          },
        ]
      : null;

  const topUpcomingAppointments =
    !loading && appointments !== null
      ? appointments
          .filter(
            (a) =>
              a.appointmentStatus === "confirmed" ||
              a.appointmentStatus === "accepted",
          )
          .sort(
            (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
          )
          .slice(0, 3)
      : [];

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
                  Here&apos;s your health overview for today
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading || !stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl border-none shadow-xs ring-0 p-0 overflow-hidden"
              >
                <CardContent className="p-5 flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-28" />
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
                        <Icon
                          size={18}
                          className="text-primary"
                          aria-hidden="true"
                        />
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
        transition={{ delay: 0.4 }}
      >
        <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300 border-none ring-0 p-0">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold mb-8">Upcoming Appointments</h2>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24 ml-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topUpcomingAppointments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays
                  size={36}
                  className="mx-auto mb-3 opacity-30"
                  aria-hidden="true"
                />
                <p className="text-sm">No upcoming appointments.</p>
                <Link
                  href="/doctors"
                  aria-label="Browse doctors to book an appointment"
                  className="text-primary text-sm font-medium hover:underline mt-2 inline-block"
                >
                  Book an appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topUpcomingAppointments.map((appointment) => {
                  const doctorName = getDoctorName(appointment);
                  const status = appointment.appointmentStatus ?? "pending";
                  const statusBadge = getStatusBadge(status);

                  return (
                    <div
                      key={appointment._id}
                      className="group border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {doctorName}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays
                                size={15}
                                className="shrink-0"
                                aria-hidden="true"
                              />
                              <span>
                                {formatAppointmentDate(
                                  appointment.appointmentDate,
                                )}
                              </span>
                            </div>
                            {appointment.appointmentTime && (
                              <div className="flex items-center gap-1.5">
                                <Clock
                                  size={15}
                                  className="shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{appointment.appointmentTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={`shrink-0 ml-3 font-medium ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </Badge>
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
