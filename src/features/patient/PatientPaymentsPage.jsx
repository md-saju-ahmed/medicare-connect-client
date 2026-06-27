"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  X,
  Receipt,
  AlertCircle,
  Stethoscope,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Banknote,
  CircleDollarSign,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken, formatDate, formatCurrency } from "@/lib/admin-utils";
import toast from "react-hot-toast";
import ComboboxFilter from "@/components/shared/ComboboxFilter";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const ITEMS_PER_PAGE = 10;

const paymentStatusConfig = {
  paid: {
    color: "bg-emerald-100 text-emerald-700",
    icon: TrendingUp,
    label: "Paid",
  },
  pending: {
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
    label: "Pending",
  },
  failed: {
    color: "bg-red-100 text-red-700",
    icon: TrendingDown,
    label: "Failed",
  },
  refunded: {
    color: "bg-purple-100 text-purple-700",
    icon: ArrowDownRight,
    label: "Refunded",
  },
};

const paymentMethodConfig = {
  credit_card: { icon: CreditCard, label: "Credit Card" },
  debit_card: { icon: CreditCard, label: "Debit Card" },
  cash: { icon: Banknote, label: "Cash" },
  insurance: { icon: CircleDollarSign, label: "Insurance" },
  online: { icon: CircleDollarSign, label: "Online" },
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const apiRequest = async (path, token, options = {}) => {
  if (!token) throw new Error("No authentication token available");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${res.status}: ${res.statusText}`,
      );
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw err;
  }
};

const StatsCardSkeleton = () => (
  <Card className="rounded-2xl shadow-xs border-none ring-0">
    <CardContent className="p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

export default function PatientPaymentsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorNames, setDoctorNames] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sessionId = session?.user?.id || session?.user?._id;

  useEffect(() => {
    if (sessionId && sessionId !== sessionIdRef.current) {
      sessionIdRef.current = sessionId;
      fetchInProgressRef.current = false;
      setCurrentPage(1);
    }
  }, [sessionId]);

  const fetchDoctorName = useCallback(async (token, doctorId) => {
    if (!doctorId) return "Unknown Doctor";
    try {
      const doctor = await apiRequest(`/doctors/${doctorId}`, token);
      return doctor.doctorName || doctor.name || "Unknown Doctor";
    } catch {
      return "Unknown Doctor";
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    if (!sessionId || fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const token = await fetchAuthToken();
      const data = await apiRequest(`/payments?patientId=${sessionId}`, token);

      if (!mountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      let paymentsArray = Array.isArray(data)
        ? data
        : data?.payments || data?.data || [];

      const doctorIds = [
        ...new Set(paymentsArray.map((p) => p.doctorId).filter(Boolean)),
      ];

      const doctorNamesMap = {};
      await Promise.all(
        doctorIds.map(async (doctorId) => {
          const name = await fetchDoctorName(token, doctorId);
          doctorNamesMap[doctorId] = name;
        }),
      );

      if (!mountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      setPayments(paymentsArray);
      setDoctorNames(doctorNamesMap);
    } catch (err) {
      if (!mountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      const message = err.message || "Failed to load payments";
      setError(message);
      toast.error(message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [sessionId, fetchDoctorName]);

  useEffect(() => {
    if (sessionLoading || !sessionId) return;
    fetchPayments();
  }, [sessionLoading, sessionId, fetchPayments]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !q ||
        doctorNames[payment.doctorId]?.toLowerCase().includes(q) ||
        payment._id?.toLowerCase().includes(q) ||
        payment.transactionId?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (payment.paymentStatus || payment.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter, doctorNames]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = useMemo(
    () =>
      filteredPayments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredPayments, currentPage],
  );

  const stats = useMemo(
    () => ({
      totalPaid: payments
        .filter((p) => (p.paymentStatus || p.status) === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPending: payments
        .filter(
          (p) =>
            (p.paymentStatus || p.status) === "pending" ||
            (p.paymentStatus || p.status) === "unpaid",
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      totalTransactions: payments.length,
    }),
    [payments],
  );

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleRetry = useCallback(() => {
    fetchInProgressRef.current = false;
    fetchPayments();
  }, [fetchPayments]);

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
          <AlertCircle
            className="h-10 w-10 text-destructive mx-auto mb-2"
            aria-hidden="true"
          />
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load payments
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={handleRetry} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = sessionLoading || loading;

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payment History</h1>
            <p className="text-muted-foreground mt-1">
              View and track all your medical payments
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            {[
              {
                icon: TrendingUp,
                iconClass: "text-emerald-500",
                bg: "bg-emerald-500/10",
                value: formatCurrency(stats.totalPaid),
                label: "Total Paid",
              },
              {
                icon: Clock,
                iconClass: "text-yellow-500",
                bg: "bg-yellow-500/10",
                value: formatCurrency(stats.totalPending),
                label: "Pending Amount",
              },
              {
                icon: Receipt,
                iconClass: "text-blue-500",
                bg: "bg-blue-500/10",
                value: stats.totalTransactions,
                label: "Total Transactions",
              },
            ].map(({ icon: Icon, iconClass, bg, value, label }) => (
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
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </motion.div>

      {/* Filters Bar */}
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
                />
                <Input
                  aria-label="Search payments"
                  placeholder="Search by doctor, transaction ID..."
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
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="Status"
                icon={Filter}
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

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="rounded-2xl shadow-xs border-none overflow-hidden p-0 ring-0">
          {isLoading ? (
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : paginatedPayments.length === 0 ? (
            <CardContent className="p-12 text-center">
              <Receipt
                size={48}
                className="mx-auto mb-4 text-muted-foreground/30"
              />
              <p className="text-lg font-semibold text-muted-foreground">
                No payments found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Your payment history will appear here"}
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
                      {[
                        "Transaction",
                        "Doctor",
                        "Amount",
                        "Method",
                        "Status",
                        "Date",
                      ].map((col, i) => (
                        <th
                          key={col}
                          className={`text-left p-4 text-sm font-semibold text-muted-foreground ${
                            i === 1
                              ? "hidden md:table-cell"
                              : i === 3
                                ? "hidden sm:table-cell"
                                : i === 5
                                  ? "hidden xl:table-cell"
                                  : ""
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment, index) => {
                      const status =
                        payment.paymentStatus || payment.status || "paid";
                      const StatusIcon =
                        paymentStatusConfig[status]?.icon || DollarSign;
                      const MethodIcon =
                        paymentMethodConfig[payment.paymentMethod]?.icon ||
                        CircleDollarSign;

                      return (
                        <motion.tr
                          key={payment._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4">
                            <p className="font-semibold text-sm font-mono">
                              {payment.transactionId ||
                                payment._id?.slice(-10).toUpperCase() ||
                                "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {payment.appointmentId
                                ? `Apt: ${payment.appointmentId?.slice(-8).toUpperCase()}`
                                : "N/A"}
                            </p>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Stethoscope
                                size={14}
                                className="text-muted-foreground"
                              />
                              <span className="text-sm">
                                {doctorNames[payment.doctorId] || "Loading..."}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-sm">
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MethodIcon size={14} />
                              {paymentMethodConfig[payment.paymentMethod]
                                ?.label ||
                                payment.paymentMethod ||
                                "—"}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={`inline-flex items-center gap-1 ${
                                paymentStatusConfig[status]?.color ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <StatusIcon size={12} />
                              {paymentStatusConfig[status]?.label || status}
                            </Badge>
                          </td>
                          <td className="p-4 hidden xl:table-cell">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar
                                size={13}
                                className="text-muted-foreground"
                              />
                              {formatDate(
                                payment.paymentDate || payment.createdAt,
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredPayments.length,
                    )}{" "}
                    of {filteredPayments.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
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
