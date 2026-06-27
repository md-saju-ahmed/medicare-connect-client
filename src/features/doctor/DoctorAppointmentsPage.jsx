"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  CreditCard,
  CalendarClock,
  Inbox,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rescheduled", value: "rescheduled" },
];

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-600",
  accepted: "bg-sky-500/10 text-sky-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  rescheduled: "bg-violet-500/10 text-violet-600",
};

async function apiRequest(path, token, options = {}) {
  if (!token) throw new Error("No authentication token available");

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP ${res.status}: ${res.statusText}`,
    );
  }

  return res.json();
}

function toArray(data, key) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data[key] && Array.isArray(data[key])) return data[key];
  return [];
}

function formatStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function safeFormatDate(dateStr) {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return isValid(date) ? format(date, "MMM d, yyyy") : dateStr;
}

function patientLabel(appointment) {
  if (appointment.patientName) return appointment.patientName;
  if (appointment.patientId) {
    return `Patient #${String(appointment.patientId).slice(-6)}`;
  }
  return "Unknown patient";
}

const StatChip = React.memo(({ label, value, icon: Icon, loading }) => {
  return (
    <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-300 ring-0 p-0 border-none overflow-hidden">
      <CardContent className="p-5 flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-5 w-8" />
          ) : (
            <p className="text-xl font-bold leading-none">{value}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
});
StatChip.displayName = "StatChip";

const AppointmentCard = React.memo(
  ({ appointment, onAccept, onReject, onComplete, actingId }) => {
    const status = appointment.appointmentStatus;
    const isActing = actingId === appointment._id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
      >
        <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm">
                  {patientLabel(appointment)}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {formatStatus(status)}
                </span>
                {appointment.paymentStatus && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <CreditCard size={12} />
                    {formatStatus(appointment.paymentStatus)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock size={14} />
                <span>
                  {safeFormatDate(appointment.appointmentDate)} ·{" "}
                  {appointment.appointmentTime || "No time"}
                </span>
              </div>

              {(appointment.reason || appointment.notes) && (
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{appointment.reason || appointment.notes}&rdquo;
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(status === "pending" || status === "rescheduled") && (
                <>
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => onAccept(appointment._id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {isActing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => onReject(appointment._id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-destructive/10 text-destructive rounded-xl text-xs font-medium hover:bg-destructive/15 transition-colors disabled:opacity-60"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </>
              )}

              {status === "accepted" && (
                <button
                  type="button"
                  disabled={isActing}
                  onClick={() =>
                    onComplete(appointment._id, appointment.patientId)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-medium hover:bg-emerald-500/15 transition-colors disabled:opacity-60"
                >
                  {isActing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ClipboardCheck size={14} />
                  )}
                  Mark Completed
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  },
);
AppointmentCard.displayName = "AppointmentCard";

export default function DoctorAppointmentsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState("all");
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (sessionLoading || !session?.user) return;

    const controller = new AbortController();

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: jwtData } = await authClient.token();
        const token = jwtData?.token;
        if (!token) throw new Error("No authentication token available");

        const doctorData = await apiRequest("/doctors/me", token, {
          signal: controller.signal,
        });
        const doctorId = doctorData._id;

        const appointmentData = await apiRequest(
          `/appointments?doctorId=${doctorId}`,
          token,
          { signal: controller.signal },
        );
        setAppointments(toArray(appointmentData, "appointments"));
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Appointments fetch error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => controller.abort();
  }, [session?.user?.id, sessionLoading]);

  const filteredAppointments = useMemo(() => {
    const list =
      filter === "all"
        ? appointments
        : appointments.filter((a) => a.appointmentStatus === filter);

    return [...list].sort((a, b) => {
      const dateA = `${a.appointmentDate ?? ""} ${a.appointmentTime ?? ""}`;
      const dateB = `${b.appointmentDate ?? ""} ${b.appointmentTime ?? ""}`;
      return dateA.localeCompare(dateB);
    });
  }, [appointments, filter]);

  const counts = useMemo(() => {
    const tally = { pending: 0, accepted: 0, completed: 0 };
    appointments.forEach((a) => {
      if (tally[a.appointmentStatus] !== undefined) {
        tally[a.appointmentStatus] += 1;
      }
    });
    return { ...tally, total: appointments.length };
  }, [appointments]);

  const handleAction = useCallback(
    async (id, action, nextStatus, patientId = null) => {
      const { data: jwtData } = await authClient.token();
      const token = jwtData?.token;
      if (!token) return;

      setActingId(id);
      setActionError(null);

      try {
        await apiRequest(`/appointments/${id}/${action}`, token, {
          method: "PATCH",
        });
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === id ? { ...a, appointmentStatus: nextStatus } : a,
          ),
        );

        if (action === "complete" && patientId) {
          router.push(
            `/dashboard/prescriptions?patientId=${patientId}&appointmentId=${id}`,
          );
        }
      } catch (err) {
        console.error(`Failed to ${action} appointment:`, err);
        setActionError(err.message || `Failed to ${action} appointment`);
      } finally {
        setActingId(null);
      }
    },
    [router],
  );

  if (!sessionLoading && !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
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
            Failed to load appointments
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Appointment Requests</h1>
            <p className="text-muted-foreground mt-1">
              Review, accept, and manage your patient bookings
            </p>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <StatChip
          label="Pending"
          value={counts.pending}
          icon={Clock}
          loading={loading}
        />
        <StatChip
          label="Accepted"
          value={counts.accepted}
          icon={CheckCircle2}
          loading={loading}
        />
        <StatChip
          label="Completed"
          value={counts.completed}
          icon={ClipboardCheck}
          loading={loading}
        />
        <StatChip
          label="Total"
          value={counts.total}
          icon={Inbox}
          loading={loading}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div
          className="flex items-center gap-2 flex-wrap"
          role="group"
          aria-label="Filter appointments by status"
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="rounded-2xl border-none shadow-xs ring-0">
            <CardContent className="p-10 text-center text-muted-foreground">
              <Inbox size={28} className="mx-auto mb-3 opacity-50" />
              No appointments found for this filter.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onAccept={(id) => handleAction(id, "accept", "accepted")}
                  onReject={(id) => handleAction(id, "reject", "rejected")}
                  onComplete={(id, patientId) =>
                    handleAction(id, "complete", "completed", patientId)
                  }
                  actingId={actingId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
}
