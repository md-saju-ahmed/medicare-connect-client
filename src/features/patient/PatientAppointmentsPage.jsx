"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComboboxFilter from "@/components/shared/ComboboxFilter";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken, toArray } from "@/lib/admin-utils";
import toast from "react-hot-toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const ITEMS_PER_PAGE = 6;

const toDateInputValue = (dateString) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "yyyy-MM-dd");
  } catch {
    return dateString;
  }
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "yyyy-MM-dd");
  } catch {
    return dateString;
  }
};

const STATUS_BADGE_MAP = {
  confirmed: { label: "confirmed", className: "bg-blue-100 text-blue-800" },
  accepted: { label: "confirmed", className: "bg-blue-100 text-blue-800" },
  pending: { label: "pending", className: "bg-amber-100 text-amber-800" },
  completed: { label: "completed", className: "bg-blue-100 text-blue-800" },
  cancelled: { label: "cancelled", className: "bg-red-100 text-red-800" },
  rescheduled: {
    label: "rescheduled",
    className: "bg-purple-100 text-purple-800",
  },
};

const getStatusBadge = (status) =>
  STATUS_BADGE_MAP[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

const formatSlotLabel = (time24) => {
  const [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${minutes} ${period}`;
};

const resolveDoctorId = (doctorId) =>
  typeof doctorId === "object" ? doctorId?._id || doctorId?.id : doctorId;

export default function PatientAppointmentsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    if (!newDate || !selectedAppointment) {
      setAvailableSlots([]);
      return;
    }

    const doctorId = resolveDoctorId(selectedAppointment.doctorId);
    if (!doctorId) return;

    const controller = new AbortController();

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setNewTime("");
      try {
        const token = await fetchAuthToken();

        const res = await fetch(`${API_BASE}/doctors/${doctorId}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch doctor schedule");

        const doctor = await res.json();

        const doctorDays = Array.isArray(doctor.availableDays)
          ? doctor.availableDays
          : [];
        const doctorSlots = Array.isArray(doctor.availableSlots)
          ? doctor.availableSlots
          : [];

        const selectedDay = new Date(newDate + "T00:00:00").toLocaleDateString(
          "en-US",
          { weekday: "short" },
        );

        if (!doctorDays.includes(selectedDay)) {
          setAvailableSlots([]);
          return;
        }

        const bookedTimes = appointments
          .filter((a) => {
            const aDocId = resolveDoctorId(a.doctorId);
            const aDate = a.appointmentDate
              ? new Date(a.appointmentDate).toISOString().split("T")[0]
              : "";
            return (
              aDocId === doctorId &&
              aDate === newDate &&
              a._id !== selectedAppointment._id &&
              a.appointmentStatus !== "cancelled" &&
              a.appointmentStatus !== "rejected"
            );
          })
          .map((a) => a.appointmentTime);

        const slotOptions = doctorSlots
          .filter((slot) => !bookedTimes.includes(slot))
          .sort()
          .map((slot) => ({ value: slot, label: formatSlotLabel(slot) }));

        setAvailableSlots(slotOptions);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn("Failed to fetch available slots:", err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
    return () => controller.abort();
  }, [newDate, selectedAppointment, appointments]);

  const fetchAppointments = useCallback(
    async (signal) => {
      if (!session?.user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await fetchAuthToken();

        const userRes = await fetch(`${API_BASE}/users/me`, {
          signal,
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!userRes.ok) throw new Error("Failed to fetch user data");

        const userData = await userRes.json();
        const patientId = userData._id || userData.id;

        const [appointmentRes, paymentRes, doctorRes] = await Promise.all([
          fetch(`${API_BASE}/appointments`, {
            signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/payments`, {
            signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/doctors`, {
            signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!appointmentRes.ok) throw new Error("Failed to fetch appointments");

        const appointmentData = await appointmentRes.json();
        const allAppointments = toArray(appointmentData, "appointments");

        const patientAppointments = allAppointments.filter(
          (app) =>
            app.patientId === patientId ||
            app.patientId?._id === patientId ||
            app.patient?._id === patientId,
        );

        let patientPayments = [];
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          const allPayments = toArray(paymentData, "payments");
          patientPayments = allPayments.filter(
            (pay) =>
              pay.patientId === patientId ||
              pay.patientId?._id === patientId ||
              pay.patient?._id === patientId,
          );
        }

        let allDoctors = [];
        if (doctorRes.ok) {
          const doctorData = await doctorRes.json();
          allDoctors = toArray(doctorData, "doctors");
        }

        const enrichedAppointments = await Promise.all(
          patientAppointments.map(async (app) => {
            if (app.doctorName || app.doctor?.doctorName) return app;

            const doctorId = resolveDoctorId(app.doctorId);
            if (!doctorId) return app;

            const existingDoctor = allDoctors.find(
              (doc) => doc._id === doctorId || doc.id === doctorId,
            );

            if (existingDoctor) {
              return {
                ...app,
                doctorName: existingDoctor.doctorName,
                doctor: existingDoctor,
                specialization: existingDoctor.specialization,
              };
            }

            try {
              const docRes = await fetch(`${API_BASE}/doctors/${doctorId}`, {
                signal,
                headers: { Authorization: `Bearer ${token}` },
              });
              if (docRes.ok) {
                const docData = await docRes.json();
                return {
                  ...app,
                  doctorName: docData.doctorName,
                  doctor: docData,
                  specialization: docData.specialization,
                };
              }
            } catch (err) {
              if (err.name === "AbortError") throw err;
              console.warn(`Failed to fetch doctor ${doctorId}:`, err);
            }

            return app;
          }),
        );

        enrichedAppointments.sort(
          (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
        );

        setAppointments(enrichedAppointments);
        setPayments(patientPayments);
        setDoctors(allDoctors);
        setHasFetched(true);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Appointments fetch error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id],
  );

  const fetchRef = useRef(fetchAppointments);
  useEffect(() => {
    fetchRef.current = fetchAppointments;
  });

  useEffect(() => {
    if (sessionLoading) return;
    const controller = new AbortController();
    fetchRef.current(controller.signal);
    return () => controller.abort();
  }, [sessionLoading, session?.user?.id]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    try {
      const token = await fetchAuthToken();
      const appointmentId = selectedAppointment._id || selectedAppointment.id;

      const res = await fetch(
        `${API_BASE}/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to cancel appointment");
      }

      toast.success("Appointment cancelled successfully");
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      const controller = new AbortController();
      fetchAppointments(controller.signal);
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error(err.message || "Failed to cancel appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !newDate || !newTime) {
      toast.error("Please select both date and time");
      return;
    }

    setActionLoading(true);
    try {
      const token = await fetchAuthToken();
      const appointmentId = selectedAppointment._id || selectedAppointment.id;

      const res = await fetch(
        `${API_BASE}/appointments/${appointmentId}/reschedule`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentDate: new Date(newDate).toISOString(),
            appointmentTime: newTime,
          }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to reschedule appointment",
        );
      }

      toast.success("Appointment rescheduled successfully");
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setNewDate("");
      setNewTime("");
      setAvailableSlots([]);
      const controller = new AbortController();
      fetchAppointments(controller.signal);
    } catch (err) {
      console.error("Reschedule error:", err);
      toast.error(err.message || "Failed to reschedule appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNow = async (appointment) => {
    try {
      setPayingId(appointment._id);
      const token = await fetchAuthToken();

      const doctorInfo = getDoctorInfo(appointment.doctorId);
      const fee =
        appointment.consultationFee ?? doctorInfo?.consultationFee ?? 150;

      const res = await fetch(`${API_BASE}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: appointment._id,
          doctorName: appointment.doctorName,
          amount: fee,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to start checkout");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Pay now error:", err);
      toast.error(err.message || "Failed to start payment");
    } finally {
      setPayingId(null);
    }
  };

  const getDoctorInfo = (doctorId) => {
    if (!doctorId) return {};
    const id = resolveDoctorId(doctorId);
    return doctors.find((doc) => doc._id === id || doc.id === id) ?? {};
  };

  const getPaymentForAppointment = (appointmentId) => {
    if (!appointmentId) return null;
    return payments.find(
      (pay) =>
        pay.appointmentId === appointmentId ||
        pay.appointmentId?._id === appointmentId ||
        pay.appointment?._id === appointmentId,
    );
  };

  const totalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = appointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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
            Failed to load appointments
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => {
              const controller = new AbortController();
              fetchAppointments(controller.signal);
            }}
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
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            {loading || !hasFetched ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">My Appointments</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and track your appointments
                </p>
              </>
            )}
          </div>
          {!loading && hasFetched && (
            <Badge variant="default" className="text-sm font-bold px-4 py-2">
              Total: {appointments.length}
            </Badge>
          )}
        </div>
      </motion.div>

      {loading || !hasFetched ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-xs ring-0 p-0">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-2xl shadow-xs bg-card ring-0 p-0">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CalendarDays
                  size={36}
                  className="text-emerald-500"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">No appointments found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                You haven&apos;t booked any appointments yet. Schedule your
                first appointment with one of our healthcare professionals.
              </p>
              <Link href="/doctors">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl transition-all shadow-md hover:shadow-lg">
                  <CalendarDays size={18} className="mr-2" aria-hidden="true" />
                  Book an Appointment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedAppointments.map((appointment, i) => {
              const doctorInfo = getDoctorInfo(appointment.doctorId);
              const doctorName =
                appointment.doctorName ??
                appointment.doctor?.doctorName ??
                doctorInfo?.doctorName ??
                "Unknown Doctor";
              const specialization =
                appointment.specialization ??
                appointment.doctor?.specialization ??
                doctorInfo?.specialization ??
                "";
              const appointmentDate = appointment.appointmentDate ?? "";
              const appointmentTime = appointment.appointmentTime ?? "";
              const status = appointment.appointmentStatus ?? "pending";
              const statusBadge = getStatusBadge(status);
              const symptoms = appointment.symptoms ?? "";
              const paymentStatus = appointment.paymentStatus ?? "unpaid";
              const consultationFee =
                appointment.consultationFee ??
                doctorInfo?.consultationFee ??
                "";
              const payment = getPaymentForAppointment(appointment._id);
              const transactionId = payment?.transactionId ?? "";

              const showActions =
                status === "pending" || status === "rescheduled";

              return (
                <motion.div
                  key={appointment._id ?? i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-200 ring-0 p-0">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex gap-2 items-center flex-wrap">
                            <h3 className="font-bold text-lg">{doctorName}</h3>
                            {specialization && (
                              <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full font-medium text-emerald-800">
                                {specialization}
                              </span>
                            )}
                          </div>
                          <Badge
                            className={`text-xs uppercase tracking-wide font-extrabold px-2.5 py-1 rounded-full shrink-0 ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays
                              size={16}
                              className="text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                            {formatDisplayDate(appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock
                              size={16}
                              className="text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                            {appointmentTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <CreditCard
                              size={16}
                              className="text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                            {paymentStatus === "paid" ? (
                              <span className="text-emerald-600 font-medium">
                                Paid (${consultationFee || "150"})
                              </span>
                            ) : (
                              <span className="text-destructive font-medium">
                                Unpaid (${consultationFee || "150"})
                              </span>
                            )}
                          </span>
                          {transactionId && (
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              TXN: {transactionId}
                            </span>
                          )}
                        </div>

                        {symptoms && (
                          <div className="text-sm text-foreground bg-muted/10 p-3 rounded-lg border border-border">
                            <strong>Symptoms:</strong> {symptoms}
                          </div>
                        )}

                        {showActions && (
                          <div className="flex items-center gap-2 pt-3">
                            {paymentStatus !== "paid" && (
                              <Button
                                size="sm"
                                aria-label={`Pay now for appointment with ${doctorName}`}
                                disabled={payingId === appointment._id}
                                onClick={() => handlePayNow(appointment)}
                                className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition h-8"
                              >
                                {payingId === appointment._id
                                  ? "Redirecting..."
                                  : "Pay now"}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Reschedule appointment with ${doctorName}`}
                              className="border border-border hover:bg-muted text-muted-foreground font-semibold text-xs px-3 py-1.5 rounded-lg transition h-8"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setNewDate(toDateInputValue(appointmentDate));
                                setNewTime(appointmentTime);
                                setRescheduleDialogOpen(true);
                              }}
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Cancel appointment with ${doctorName}`}
                              className="border border-destructive/30 hover:bg-destructive/10 text-destructive font-semibold text-xs px-3 py-1.5 rounded-lg transition h-8"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setCancelDialogOpen(true);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedAppointment(null);
        }}
        title="Cancel Appointment"
        confirmLabel="Yes, Cancel"
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onConfirm={handleCancelAppointment}
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to cancel this appointment? This action cannot
          be undone.
        </p>
        {selectedAppointment && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="font-semibold">
              {selectedAppointment.doctorName ??
                selectedAppointment.doctor?.doctorName ??
                "Unknown Doctor"}
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Date: {formatDisplayDate(selectedAppointment.appointmentDate)}
              </p>
              <p>Time: {selectedAppointment.appointmentTime}</p>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={rescheduleDialogOpen}
        onClose={() => {
          setRescheduleDialogOpen(false);
          setSelectedAppointment(null);
          setNewDate("");
          setNewTime("");
          setAvailableSlots([]);
        }}
        title="Reschedule Appointment"
        confirmLabel="Confirm Reschedule"
        onConfirm={handleRescheduleAppointment}
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground mb-4">
          Select a new date and time for your appointment.
        </p>
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-semibold">
                {selectedAppointment.doctorName ??
                  selectedAppointment.doctor?.doctorName ??
                  "Unknown Doctor"}
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Current Date:{" "}
                  {formatDisplayDate(selectedAppointment.appointmentDate)}
                </p>
                <p>Current Time: {selectedAppointment.appointmentTime}</p>
              </div>
            </div>
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="new-date">New Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="bg-background border-border border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-time">New Time</Label>
                {!newDate ? (
                  <p className="text-sm text-muted-foreground">
                    Select a date first to see available slots.
                  </p>
                ) : slotsLoading ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2
                      size={14}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Loading available slots…
                  </p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-destructive">
                    No available slots on this date. Please choose another date.
                  </p>
                ) : (
                  <ComboboxFilter
                    options={availableSlots}
                    value={newTime}
                    onChange={setNewTime}
                    placeholder="Select available time"
                    icon={Clock}
                    width="w-full"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
