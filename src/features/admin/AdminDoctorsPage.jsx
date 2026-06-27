"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MoreHorizontal,
  ShieldAlert,
  Mail,
  Phone,
  Star,
  Stethoscope,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  BadgeCheck,
  Ban,
  AlertTriangle,
  ShieldX,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ComboboxFilter from "@/components/shared/ComboboxFilter";
import {
  fetchAuthToken,
  buildHeaders,
  getInitials,
  toArray,
} from "@/lib/admin-utils";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const ITEMS_PER_PAGE = 10;

const verificationStatusConfig = {
  verified: {
    color: "bg-emerald-100 text-emerald-700",
    icon: BadgeCheck,
    label: "Verified",
  },
  pending: {
    color: "bg-yellow-100 text-yellow-700",
    icon: ShieldAlert,
    label: "Pending",
  },
  rejected: {
    color: "bg-red-100 text-red-700",
    icon: ShieldX,
    label: "Rejected",
  },
};

const statusConfig = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-700",
};

const verificationOptions = [
  { value: "all", label: "All Verification" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

export default function AdminDoctorsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedDoctor(null);
  };

  const fetchDoctors = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const token = await fetchAuthToken();
      const headers = buildHeaders(token);

      const usersRes = await fetch(`${API_BASE}/users`, { signal, headers });
      if (!usersRes.ok) throw new Error("Failed to fetch users");

      const usersData = await usersRes.json();
      const users = toArray(usersData, "users");

      const usersMap = {};
      const usersByEmail = {};
      users.forEach((user) => {
        usersMap[user._id] = user;
        if (user.email) usersByEmail[user.email.toLowerCase()] = user;
      });

      const res = await fetch(`${API_BASE}/doctors/all`, { signal, headers });
      if (!res.ok) throw new Error("Failed to fetch doctors");

      const data = await res.json();
      const doctorsList = data.doctors || [];

      const enrichedDoctors = doctorsList.map((doctor) => {
        const userEmail = doctor.email?.toLowerCase();
        const matchedUser =
          usersMap[doctor.userId] ||
          (userEmail ? usersByEmail[userEmail] : null) ||
          usersMap[doctor._id] ||
          {};
        return {
          ...doctor,
          name: doctor.doctorName || matchedUser.name || "Unknown",
          email: doctor.email || matchedUser.email || "",
          phone: doctor.phone || matchedUser.phone || "",
          image: doctor.image || matchedUser.image || "",
          status: matchedUser.status || doctor.status || "active",
          _user: matchedUser,
        };
      });

      setDoctors(enrichedDoctors);
    } catch (err) {
      if (err.name === "AbortError" || signal?.aborted) return;
      setError(err.message);
      toast.error("Failed to load doctors");
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
    fetchDoctors(controller.signal);
    return () => controller.abort();
  }, [session?.user?.id, sessionLoading, fetchDoctors]);

  const handleVerificationAction = async (newStatus, extraBody = {}) => {
    if (!selectedDoctor) return;
    const doctorId = selectedDoctor._id;
    try {
      setActionLoading(true);
      const token = await fetchAuthToken();

      const res = await fetch(`${API_BASE}/doctors/${doctorId}/verification`, {
        method: "PATCH",
        headers: buildHeaders(token),
        body: JSON.stringify({ verificationStatus: newStatus, ...extraBody }),
      });

      if (!res.ok)
        throw new Error(`Failed to update verification to ${newStatus}`);

      setDoctors((prev) =>
        prev.map((d) =>
          d._id === doctorId
            ? { ...d, verificationStatus: newStatus, ...extraBody }
            : d,
        ),
      );

      const messages = {
        verified: `${selectedDoctor.name} has been verified`,
        rejected: `${selectedDoctor.name}'s verification rejected`,
        pending: `${selectedDoctor.name}'s verification revoked`,
      };
      toast.success(messages[newStatus]);
      closeDialog();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSearch =
        !q ||
        doctor.name?.toLowerCase().includes(q) ||
        doctor.email?.toLowerCase().includes(q) ||
        doctor.specialization?.toLowerCase().includes(q);
      const matchesVerification =
        verificationFilter === "all" ||
        doctor.verificationStatus === verificationFilter;
      const matchesStatus =
        statusFilter === "all" || doctor.status === statusFilter;
      return matchesSearch && matchesVerification && matchesStatus;
    });
  }, [doctors, searchQuery, verificationFilter, statusFilter]);

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);

  const paginatedDoctors = useMemo(
    () =>
      filteredDoctors.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredDoctors, currentPage],
  );

  const stats = useMemo(() => {
    if (loading || doctors.length === 0) return null;
    return {
      pending: doctors.filter((d) => d.verificationStatus === "pending").length,
      verified: doctors.filter((d) => d.verificationStatus === "verified")
        .length,
      rejected: doctors.filter((d) => d.verificationStatus === "rejected")
        .length,
    };
  }, [doctors, loading]);

  const hasActiveFilters =
    searchQuery !== "" ||
    verificationFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setVerificationFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-20">
        <div className="bg-destructive/10 p-6 rounded-2xl max-w-md">
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load doctors
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
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
            <h1 className="text-3xl font-bold">Manage Doctors</h1>
            <p className="text-muted-foreground mt-1">
              Verify and manage doctor accounts
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        {loading || !stats
          ? Array.from({ length: 3 }).map((_, i) => (
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
                icon: ShieldAlert,
                iconClass: "text-yellow-500",
                bg: "bg-yellow-500/10",
                count: stats.pending,
                label: "Pending",
              },
              {
                icon: BadgeCheck,
                iconClass: "text-emerald-500",
                bg: "bg-emerald-500/10",
                count: stats.verified,
                label: "Verified",
              },
              {
                icon: ShieldX,
                iconClass: "text-red-500",
                bg: "bg-red-500/10",
                count: stats.rejected,
                label: "Rejected",
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
                  aria-label="Search doctors"
                  placeholder="Search by name, email or specialization..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-10 bg-muted/10 border-border border"
                />
              </div>
              <ComboboxFilter
                options={verificationOptions}
                value={verificationFilter}
                onChange={handleFilterChange(setVerificationFilter)}
                placeholder="Verification"
                icon={Filter}
                width="w-full sm:w-44"
                contentWidth="w-[200px]"
              />
              <ComboboxFilter
                options={statusOptions}
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
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
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : paginatedDoctors.length === 0 ? (
            <CardContent className="p-12 text-center">
              <Stethoscope
                size={48}
                className="mx-auto mb-4 text-muted-foreground/30"
              />
              <p className="text-lg font-semibold text-muted-foreground">
                No doctors found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "No doctors have registered yet"}
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
                        Doctor
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">
                        Specialization
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                        Contact
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                        Verification
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">
                        Status
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden xl:table-cell">
                        Rating
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDoctors.map((doctor, index) => {
                      const vStatus = doctor.verificationStatus || "pending";

                      return (
                        <motion.tr
                          key={doctor._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {doctor.image && (
                                  <AvatarImage
                                    src={doctor.image}
                                    alt={doctor.name}
                                  />
                                )}
                                <AvatarFallback>
                                  {getInitials(doctor.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">
                                  {doctor.name || "Unknown"}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock size={11} />
                                  {doctor.experience || 0}+ yrs exp
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Stethoscope
                                size={14}
                                className="text-muted-foreground"
                              />
                              <span className="text-sm">
                                {doctor.specialization || "General"}
                              </span>
                            </div>
                            {doctor.licenseNumber && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                License: {doctor.licenseNumber}
                              </p>
                            )}
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail size={13} />
                                {doctor.email || "—"}
                              </div>
                              {doctor.phone && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Phone size={13} />
                                  {doctor.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={
                                verificationStatusConfig[vStatus]?.color ||
                                "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {verificationStatusConfig[vStatus]?.label ||
                                "Pending"}
                            </Badge>
                            {doctor.rejectionReason && (
                              <p className="text-xs text-red-500 mt-1 max-w-32 truncate">
                                {doctor.rejectionReason}
                              </p>
                            )}
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <Badge
                              className={
                                (statusConfig[doctor.status] ||
                                  "bg-gray-100 text-gray-700") + " capitalize"
                              }
                            >
                              {doctor.status || "unknown"}
                            </Badge>
                          </td>
                          <td className="p-4 hidden xl:table-cell">
                            <div className="flex items-center gap-1">
                              <Star
                                size={14}
                                className="text-yellow-400 fill-yellow-400"
                              />
                              <span className="text-sm font-medium">
                                {doctor.rating?.toFixed(1) || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Doctor actions"
                                >
                                  <MoreHorizontal size={18} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                  Verification Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {vStatus !== "verified" && (
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-600"
                                    onClick={() => {
                                      setSelectedDoctor(doctor);
                                      setActiveDialog("verify");
                                    }}
                                  >
                                    <BadgeCheck size={16} className="mr-2" />
                                    Verify Doctor
                                  </DropdownMenuItem>
                                )}
                                {vStatus === "pending" && (
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      setSelectedDoctor(doctor);
                                      setActiveDialog("reject");
                                    }}
                                  >
                                    <Ban size={16} className="mr-2" />
                                    Reject Verification
                                  </DropdownMenuItem>
                                )}
                                {vStatus === "verified" && (
                                  <DropdownMenuItem
                                    className="text-yellow-600 focus:text-yellow-600"
                                    onClick={() => {
                                      setSelectedDoctor(doctor);
                                      setActiveDialog("revoke");
                                    }}
                                  >
                                    <AlertTriangle size={16} className="mr-2" />
                                    Revoke Verification
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                      filteredDoctors.length,
                    )}{" "}
                    of {filteredDoctors.length}
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

      <ConfirmDialog
        open={activeDialog === "verify"}
        onClose={closeDialog}
        title="Verify Doctor"
        confirmLabel="Verify Doctor"
        confirmClassName="bg-emerald-600 hover:bg-emerald-700 text-white"
        onConfirm={() =>
          handleVerificationAction("verified", { status: "active" })
        }
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to verify{" "}
          <span className="font-semibold text-foreground">
            {selectedDoctor?.name}
          </span>
          ? They will be able to start practicing on the platform.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={activeDialog === "reject"}
        onClose={closeDialog}
        title="Reject Verification"
        confirmLabel="Reject Verification"
        confirmClassName="bg-destructive hover:bg-destructive/90 text-white"
        onConfirm={() => handleVerificationAction("rejected")}
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to reject{" "}
          <span className="font-semibold text-foreground">
            {selectedDoctor?.name}
          </span>
          &apos;s verification?
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={activeDialog === "revoke"}
        onClose={closeDialog}
        title="Revoke Verification"
        confirmLabel="Revoke Verification"
        confirmClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
        onConfirm={() => handleVerificationAction("pending")}
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to revoke the verification of{" "}
          <span className="font-semibold text-foreground">
            {selectedDoctor?.name}
          </span>
          ? They will no longer be able to practice on the platform until
          re-verified.
        </p>
      </ConfirmDialog>
    </>
  );
}
