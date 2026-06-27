"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MoreHorizontal,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
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
  formatDate,
} from "@/lib/admin-utils";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const ITEMS_PER_PAGE = 10;

const roleConfig = {
  admin: { color: "bg-purple-100 text-purple-700" },
  doctor: { color: "bg-blue-100 text-blue-700" },
  patient: { color: "bg-green-100 text-green-700" },
};

const statusConfig = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-700",
};

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "patient", label: "Patient" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

/** An admin can act on a user only if that user is not themselves or another admin. */
function canModifyUser(currentUser, targetUser) {
  return (
    currentUser?.role === "admin" &&
    currentUser?._id !== targetUser._id &&
    targetUser.role !== "admin"
  );
}

const canDeleteUser = canModifyUser;

export default function AdminUsersPage() {
  const { data: session } = authClient.useSession();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await fetchAuthToken();
      const res = await fetch(`${API_BASE}/users`, {
        headers: buildHeaders(token),
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(
        Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data)
            ? data
            : [],
      );
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSuspend = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const token = await fetchAuthToken();

      const res = await fetch(`${API_BASE}/users/${selectedUser._id}/suspend`, {
        method: "PATCH",
        headers: buildHeaders(token),
      });

      if (!res.ok) throw new Error("Failed to suspend user");

      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id ? { ...u, status: "suspended" } : u,
        ),
      );
      toast.success(`${selectedUser.name} has been suspended`);
      setSuspendDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (user) => {
    try {
      const token = await fetchAuthToken();

      const res = await fetch(`${API_BASE}/users/${user._id}`, {
        method: "PATCH",
        headers: buildHeaders(token),
        body: JSON.stringify({ status: "active" }),
      });

      if (!res.ok) throw new Error("Failed to reactivate user");

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: "active" } : u)),
      );
      toast.success(`${user.name} has been reactivated`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const token = await fetchAuthToken();

      const res = await fetch(`${API_BASE}/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: buildHeaders(token),
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      toast.success(`${selectedUser.name} has been deleted`);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredUsers, currentPage],
  );

  const hasActiveFilters =
    searchQuery !== "" || roleFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
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
            Failed to load users
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={loadUsers} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manage Users</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all registered users
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                  aria-label="Search users"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-10 bg-muted/10 border-border border"
                />
              </div>
              <ComboboxFilter
                options={roleOptions}
                value={roleFilter}
                onChange={handleFilterChange(setRoleFilter)}
                placeholder="Role"
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

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-2xl shadow-xs border-none overflow-hidden ring-0 p-0">
          {loading ? (
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : paginatedUsers.length === 0 ? (
            <CardContent className="p-12 text-center">
              <Users
                size={48}
                className="mx-auto mb-4 text-muted-foreground/30"
              />
              <p className="text-lg font-semibold text-muted-foreground">
                No users found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "No users have registered yet"}
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
                        User
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">
                        Contact
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">
                        Status
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user, index) => {
                      const userCanBeModified = canModifyUser(
                        session?.user,
                        user,
                      );
                      const userCanBeDeleted = canDeleteUser(
                        session?.user,
                        user,
                      );

                      return (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {user.image && (
                                  <AvatarImage
                                    src={user.image}
                                    alt={user.name}
                                  />
                                )}
                                <AvatarFallback>
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">
                                  {user.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground md:hidden">
                                  {user.email || "No email"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail size={13} />
                                {user.email || "—"}
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Phone size={13} />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={`capitalize ${
                                roleConfig[user.role]?.color ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <Badge
                              className={`capitalize ${
                                statusConfig[user.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar size={13} />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            {userCanBeModified ? (
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="User actions"
                                  >
                                    <MoreHorizontal size={18} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {user.status !== "suspended" ? (
                                    <DropdownMenuItem
                                      className="text-yellow-600 focus:text-yellow-600"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setSuspendDialogOpen(true);
                                      }}
                                    >
                                      <UserX size={16} className="mr-2" />
                                      Suspend User
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-emerald-600 focus:text-emerald-600"
                                      onClick={() => handleReactivate(user)}
                                    >
                                      <UserCheck size={16} className="mr-2" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  {userCanBeDeleted && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setDeleteDialogOpen(true);
                                        }}
                                      >
                                        <UserX size={16} className="mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {session?.user?._id === user._id
                                  ? "You"
                                  : "Admin"}
                              </span>
                            )}
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
                      filteredUsers.length,
                    )}{" "}
                    of {filteredUsers.length}
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

      {/* Suspend confirmation */}
      <ConfirmDialog
        open={suspendDialogOpen}
        onClose={() => {
          setSuspendDialogOpen(false);
          setSelectedUser(null);
        }}
        title="Suspend User"
        confirmLabel="Suspend User"
        confirmClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
        onConfirm={handleSuspend}
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to suspend{" "}
          <span className="font-semibold text-foreground">
            {selectedUser?.name}
          </span>
          ? They will no longer be able to access the platform.
        </p>
      </ConfirmDialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        confirmLabel="Delete User"
        confirmClassName="bg-destructive hover:bg-destructive/90 text-white"
        onConfirm={handleDelete}
        loading={actionLoading}
      >
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. All data associated with{" "}
          <span className="font-semibold text-foreground">
            {selectedUser?.name}
          </span>{" "}
          will be permanently removed.
        </p>
      </ConfirmDialog>
    </>
  );
}
