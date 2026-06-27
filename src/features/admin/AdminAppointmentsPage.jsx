"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ComboboxFilter from "@/components/shared/ComboboxFilter";
import {
  fetchAuthToken,
  buildHeaders,
  toArray,
  formatDate,
} from "@/lib/admin-utils";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const ITEMS_PER_PAGE = 10;

const appointmentStatusConfig = {
  pending: {
    color: "bg-yellow-100 text-yellow-700",
    label: "Pending",
  },
  accepted: {
    color: "bg-blue-100 text-blue-700",
    label: "Accepted",
  },
  completed: {
    color: "bg-emerald-100 text-emerald-700",
    label: "Completed",
  },
  cancelled: {
    color: "bg-red-100 text-red-700",
    label: "Cancelled",
  },
  rescheduled: {
    color: "bg-purple-100 text-purple-700",
    label: "Rescheduled",
  },
  rejected: {
    color: "bg-red-100 text-red-700",
    label: "Rejected",
  },
};

const paymentStatusConfig = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-yellow-100 text-yellow-700",
  refunded: "bg-purple-100 text-purple-700",
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
  { value: "rescheduled", label: "Rescheduled" },
];

const paymentOptions = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "refunded", label: "Refunded" },
];

export default function AdminAppointmentsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const fetchAppointments = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const token = await fetchAuthToken();
      const headers = buildHeaders(token);

      const [appointmentsRes, usersRes, doctorsRes] = await Promise.all([
        fetch(`${API_BASE}/appointments`, { signal, headers }),
        fetch(`${API_BASE}/users`, { signal, headers }),
        fetch(`${API_BASE}/doctors/all`, { signal, headers }),
      ]);

      if (!appointmentsRes.ok) throw new Error("Failed to fetch appointments");

      const data = await appointmentsRes.json();
      const appointmentsList = toArray(data, "appointments");

      const usersMap = {};
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        toArray(usersData, "users").forEach((user) => {
          usersMap[user._id] = user;
        });
      }

      const doctorsMap = {};
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        toArray(doctorsData, "doctors").forEach((doc) => {
          doctorsMap[doc._id] = doc;
        });
      }

      const enrichedAppointments = appointmentsList.map((apt) => {
        const patientUser = usersMap[apt.patientId] || apt.patient || {};
        const doctorDoc = doctorsMap[apt.doctorId] || apt.doctor || {};
        return {
          ...apt,
          patientName: apt.patientName || patientUser.name || "Unknown Patient",
          doctorName:
            apt.doctorName || doctorDoc.doctorName || "Unknown Doctor",
        };
      });

      setAppointments(enrichedAppointments);
    } catch (err) {
      if (err.name === "AbortError" || signal?.aborted) return;
      setError(err.message);
      toast.error("Failed to load appointments");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetchAppointments(controller.signal);
    return () => controller.abort();
  }, [session?.user?.id, sessionLoading, fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return appointments.filter((apt) => {
      const matchesSearch =
        query === "" ||
        apt.patientName?.toLowerCase().includes(query) ||
        apt.doctorName?.toLowerCase().includes(query) ||
        apt.patient?.name?.toLowerCase().includes(query) ||
        apt.doctor?.name?.toLowerCase().includes(query) ||
        apt._id?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || apt.appointmentStatus === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || apt.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [appointments, searchQuery, statusFilter, paymentFilter]);

  const { totalPages, paginatedAppointments } = useMemo(() => {
    const total = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
    const paginated = filteredAppointments.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
    return { totalPages: total, paginatedAppointments: paginated };
  }, [filteredAppointments, currentPage]);

  const stats = useMemo(() => {
    if (loading || appointments.length === 0) return null;

    return appointments.reduce(
      (acc, apt) => {
        const status = apt.appointmentStatus;
        if (status === "pending") acc.pending++;
        else if (status === "accepted") acc.accepted++;
        else if (status === "completed") acc.completed++;
        else if (status === "cancelled" || status === "rejected")
          acc.cancelled++;
        return acc;
      },
      { pending: 0, accepted: 0, completed: 0, cancelled: 0 },
    );
  }, [appointments, loading]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || paymentFilter !== "all";

  const handleRetry = () => {
    setError(null);
    const controller = new AbortController();
    fetchAppointments(controller.signal);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-20">
        <div className="bg-destructive/10 p-6 rounded-2xl max-w-md">
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load appointments
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={handleRetry} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appointments Registry</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and track all appointments across the platform
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
      >
        {loading || !stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl shadow-xs border-none ring-0"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          : [
              {
                icon: AlertCircle,
                iconClass: "text-yellow-500",
                bg: "bg-yellow-500/10",
                count: stats.pending,
                label: "Pending",
              },
              {
                icon: CheckCircle,
                iconClass: "text-blue-500",
                bg: "bg-blue-500/10",
                count: stats.accepted,
                label: "Accepted",
              },
              {
                icon: CheckCircle,
                iconClass: "text-emerald-500",
                bg: "bg-emerald-500/10",
                count: stats.completed,
                label: "Completed",
              },
              {
                icon: XCircle,
                iconClass: "text-red-500",
                bg: "bg-red-500/10",
                count: stats.cancelled,
                label: "Cancelled",
              },
            ].map(({ icon: Icon, iconClass, bg, count, label }) => (
              <Card
                key={label}
                className="rounded-2xl shadow-xs border-none ring-0"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={18} className={iconClass} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-2xl shadow-xs border-none mb-6 ring-0 p-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Search appointments"
                  placeholder="Search by patient, doctor or appointment ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-10 bg-muted/10 border-border border"
                />
              </div>
              <ComboboxFilter
                options={statusOptions}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
                placeholder="Status"
                icon={Filter}
                width="w-full sm:w-44"
                contentWidth="w-[200px]"
              />
              <ComboboxFilter
                options={paymentOptions}
                value={paymentFilter}
                onChange={(v) => {
                  setPaymentFilter(v);
                  setCurrentPage(1);
                }}
                placeholder="Payment"
                icon={DollarSign}
                width="w-full sm:w-44"
                contentWidth="w-[200px]"
              />
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                >
                  <X size={18} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="rounded-2xl shadow-xs border-none overflow-hidden ring-0 p-0">
          {loading || sessionLoading ? (
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : paginatedAppointments.length === 0 ? (
            <CardContent className="p-12 text-center">
              <Clock
                size={48}
                className="mx-auto mb-4 text-muted-foreground/30"
              />
              <p className="text-lg font-semibold text-muted-foreground">
                No appointments found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "No appointments have been booked yet"}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                        Appointment
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">
                        Patient
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                        Doctor
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">
                        Date &amp; Time
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden xl:table-cell">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.map((apt, index) => {
                      const patientName =
                        apt.patientName ||
                        apt.patient?.name ||
                        "Unknown Patient";
                      const doctorName =
                        apt.doctorName ||
                        apt.doctor?.name ||
                        apt.doctor?.doctorName ||
                        "Unknown Doctor";

                      return (
                        <motion.tr
                          key={apt._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4">
                            <p className="font-semibold text-sm">
                              {apt._id?.slice(-8).toUpperCase() || "—"}
                            </p>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <span className="text-sm">{patientName}</span>
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className="text-sm">{doctorName}</span>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar
                                size={13}
                                className="text-muted-foreground"
                              />
                              {formatDate(apt.appointmentDate)}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={
                                appointmentStatusConfig[apt.appointmentStatus]
                                  ?.color || "bg-gray-100 text-gray-700"
                              }
                            >
                              {appointmentStatusConfig[apt.appointmentStatus]
                                ?.label ||
                                (apt.appointmentStatus
                                  ? apt.appointmentStatus
                                      .charAt(0)
                                      .toUpperCase() +
                                    apt.appointmentStatus.slice(1)
                                  : "")}
                            </Badge>
                          </td>
                          <td className="p-4 hidden xl:table-cell">
                            <Badge
                              className={
                                paymentStatusConfig[apt.paymentStatus] ||
                                "bg-gray-100 text-gray-700"
                              }
                            >
                              {apt.paymentStatus
                                ? apt.paymentStatus.charAt(0).toUpperCase() +
                                  apt.paymentStatus.slice(1)
                                : "Unpaid"}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredAppointments.length,
                    )}{" "}
                    of {filteredAppointments.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Go to page ${page}`}
                          aria-current={
                            currentPage === page ? "page" : undefined
                          }
                          className="h-8 w-8"
                        >
                          {page}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>
    </>
  );
}
