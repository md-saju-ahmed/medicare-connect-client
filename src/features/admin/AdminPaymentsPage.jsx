"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  CircleDollarSign,
  ArrowDownRight,
  Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ComboboxFilter from "@/components/shared/ComboboxFilter";
import { authClient } from "@/lib/auth-client";
import {
  fetchAuthToken,
  buildHeaders,
  toArray,
  formatDate,
  formatCurrency,
} from "@/lib/admin-utils";
import toast from "react-hot-toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const ITEMS_PER_PAGE = 10;

const paymentStatusConfig = {
  paid: {
    color: "bg-emerald-100 text-emerald-700",
    icon: TrendingUp,
    label: "Paid",
  },
  unpaid: {
    color: "bg-yellow-100 text-yellow-700",
    icon: TrendingDown,
    label: "Unpaid",
  },
  refunded: {
    color: "bg-purple-100 text-purple-700",
    icon: ArrowDownRight,
    label: "Refunded",
  },
  pending: {
    color: "bg-orange-100 text-orange-700",
    icon: Clock,
    label: "Pending",
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
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];

const methodOptions = [
  { value: "all", label: "All Methods" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "cash", label: "Cash" },
  { value: "insurance", label: "Insurance" },
  { value: "online", label: "Online" },
];

export default function AdminPaymentsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayments = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const token = await fetchAuthToken();
      const headers = buildHeaders(token);

      const [paymentsRes, usersRes, doctorsRes] = await Promise.all([
        fetch(`${API_BASE}/payments`, { signal, headers }),
        fetch(`${API_BASE}/users`, { signal, headers }),
        fetch(`${API_BASE}/doctors/all`, { signal, headers }),
      ]);

      if (!paymentsRes.ok) throw new Error("Failed to fetch payments");

      const data = await paymentsRes.json();
      const paymentsList = toArray(data, "payments");

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

      const enrichedPayments = paymentsList.map((payment) => {
        const patientUser =
          usersMap[payment.patientId] || payment.patient || {};
        const doctorDoc = doctorsMap[payment.doctorId] || payment.doctor || {};
        return {
          ...payment,
          patientName:
            payment.patientName || patientUser.name || "Unknown Patient",
          doctorName:
            payment.doctorName || doctorDoc.doctorName || "Unknown Doctor",
          doctorImage: payment.doctorImage || doctorDoc.profileImage || "",
        };
      });

      setPayments(enrichedPayments);
    } catch (err) {
      if (err.name === "AbortError" || signal?.aborted) return;
      setError(err.message);
      toast.error("Failed to load payments");
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
    fetchPayments(controller.signal);
    return () => controller.abort();
  }, [session?.user?.id, sessionLoading, fetchPayments]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !q ||
        payment.patientName?.toLowerCase().includes(q) ||
        payment.doctorName?.toLowerCase().includes(q) ||
        payment._id?.toLowerCase().includes(q) ||
        payment.transactionId?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || payment.paymentStatus === statusFilter;

      const matchesMethod =
        methodFilter === "all" || payment.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, searchQuery, statusFilter, methodFilter]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);

  const paginatedPayments = useMemo(
    () =>
      filteredPayments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredPayments, currentPage],
  );

  const stats = useMemo(() => {
    if (loading || payments.length === 0) return null;
    return {
      totalRevenue: payments
        .filter((p) => p.paymentStatus === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingAmount: payments
        .filter(
          (p) => p.paymentStatus === "unpaid" || p.paymentStatus === "pending",
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      refundedAmount: payments
        .filter((p) => p.paymentStatus === "refunded")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      totalTransactions: payments.length,
    };
  }, [payments, loading]);

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || methodFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleRetry = useCallback(() => {
    const controller = new AbortController();
    fetchPayments(controller.signal);
    return () => controller.abort();
  }, [fetchPayments]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-20">
        <div className="bg-destructive/10 p-6 rounded-2xl max-w-md">
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Cash Flows</h1>
            <p className="text-muted-foreground mt-1">
              Track and monitor all payment transactions
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
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
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          : [
              {
                icon: TrendingUp,
                iconClass: "text-emerald-500",
                bg: "bg-emerald-500/10",
                value: formatCurrency(stats.totalRevenue),
                label: "Total Revenue",
              },
              {
                icon: Clock,
                iconClass: "text-yellow-500",
                bg: "bg-yellow-500/10",
                value: formatCurrency(stats.pendingAmount),
                label: "Pending Amount",
              },
              {
                icon: ArrowDownRight,
                iconClass: "text-purple-500",
                bg: "bg-purple-500/10",
                value: formatCurrency(stats.refundedAmount),
                label: "Refunded",
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
                />
                <Input
                  aria-label="Search payments"
                  placeholder="Search by patient, doctor, transaction ID..."
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
                onChange={handleFilterChange(setStatusFilter)}
                placeholder="Status"
                icon={Filter}
                width="w-full sm:w-44"
                contentWidth="w-[200px]"
              />
              <ComboboxFilter
                options={methodOptions}
                value={methodFilter}
                onChange={handleFilterChange(setMethodFilter)}
                placeholder="Method"
                icon={CreditCard}
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
        <Card className="rounded-2xl shadow-xs border-none overflow-hidden p-0 ring-0">
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
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : paginatedPayments.length === 0 ? (
            <CardContent className="p-12 text-center">
              <DollarSign
                size={48}
                className="mx-auto mb-4 text-muted-foreground/30"
              />
              <p className="text-lg font-semibold text-muted-foreground">
                No payments found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "No payments have been recorded yet"}
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
                        "Patient",
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
                              : i === 2
                                ? "hidden lg:table-cell"
                                : i === 4
                                  ? "hidden sm:table-cell"
                                  : i === 6
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
                      const StatusIcon =
                        paymentStatusConfig[payment.paymentStatus]?.icon ||
                        DollarSign;
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
                            <span className="text-sm">
                              {payment.patientName}
                            </span>
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className="text-sm">
                              {payment.doctorName}
                            </span>
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
                                paymentStatusConfig[payment.paymentStatus]
                                  ?.color || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <StatusIcon size={12} />
                              {paymentStatusConfig[payment.paymentStatus]
                                ?.label || payment.paymentStatus}
                            </Badge>
                          </td>
                          <td className="p-4 hidden xl:table-cell">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar
                                size={13}
                                className="text-muted-foreground"
                              />
                              {formatDate(payment.createdAt || payment.date)}
                            </div>
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
