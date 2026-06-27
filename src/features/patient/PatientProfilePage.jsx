"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken } from "@/lib/admin-utils";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { useDashboardContext } from "@/app/dashboard/DashboardContext";
import ComboboxFilter from "@/components/shared/ComboboxFilter";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
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

const normalizeUrl = (value) => {
  if (!value) return value;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const buildProfilePatch = (data, updatedUser, fallbackEmail) => ({
  name: updatedUser.name ?? data.name,
  email: updatedUser.email ?? fallbackEmail,
  image: updatedUser.image ?? data.image,
  phone: updatedUser.phone ?? data.phone,
  address: updatedUser.address ?? data.address,
  dateOfBirth: updatedUser.dateOfBirth ?? data.dateOfBirth,
  bloodGroup: updatedUser.bloodGroup ?? data.bloodGroup,
  gender: updatedUser.gender ?? data.gender,
});

const FormField = ({ label, children, error }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

export default function PatientProfilePage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { user, setUser } = useDashboardContext();

  const [state, setState] = useState({ loading: true, error: null });
  const fetchedForRef = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      image: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      bloodGroup: "",
      gender: "",
    },
    mode: "onChange",
  });

  const sessionId = session?.user?.id || session?.user?._id;

  const fetchProfile = useCallback(async () => {
    if (!sessionId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const token = await fetchAuthToken();
      const userData = await apiRequest("/users/me", token);

      setUser(userData);

      reset({
        name: userData.name ?? "",
        email: userData.email ?? "",
        image: userData.image ?? "",
        phone: userData.phone ?? "",
        address: userData.address ?? "",
        dateOfBirth: userData.dateOfBirth
          ? userData.dateOfBirth.split("T")[0]
          : "",
        bloodGroup: userData.bloodGroup ?? "",
        gender: userData.gender ?? "",
      });

      fetchedForRef.current = sessionId;
      setState((prev) => ({ ...prev, loading: false, error: null }));
    } catch (err) {
      const message = err.message || "Failed to load profile";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
      fetchedForRef.current = null;
    }
  }, [sessionId, reset, setUser]);

  useEffect(() => {
    if (sessionLoading || !sessionId) return;
    if (fetchedForRef.current === sessionId) return;
    fetchProfile();
  }, [sessionId, sessionLoading, fetchProfile]);

  const onSubmit = useCallback(
    async (data) => {
      if (!user) return;

      try {
        const token = await fetchAuthToken();

        const userId = user._id || user.id;
        const normalizedImage = normalizeUrl(data.image || "");

        const payload = {
          name: data.name,
          image: normalizedImage,
          phone: data.phone || "",
          address: data.address || "",
          dateOfBirth: data.dateOfBirth || "",
          bloodGroup: data.bloodGroup || "",
          gender: data.gender || "",
        };

        const updatedUser = await apiRequest(`/users/${userId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        await authClient.updateUser({
          name: updatedUser.name ?? data.name,
          image: updatedUser.image ?? normalizedImage,
        });

        const submittedData = { ...data, image: normalizedImage };
        const patch = buildProfilePatch(submittedData, updatedUser, user.email);

        setUser((prev) => ({ ...prev, ...updatedUser, ...patch }));

        reset(patch);

        toast.success("Profile updated successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to update profile");
      }
    },
    [user, reset, setUser],
  );

  const handleRetry = useCallback(() => {
    fetchedForRef.current = null;
    fetchProfile();
  }, [fetchProfile]);

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

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-20">
        <div className="bg-destructive/10 p-6 rounded-2xl max-w-md">
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load profile
          </p>
          <p className="text-muted-foreground text-sm">{state.error}</p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isLoading = sessionLoading || state.loading;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">Profile Management</h1>
                <p className="text-muted-foreground mt-1">
                  Keep your personal information accurate and up to date
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
          <CardContent className="p-6 md:p-8">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="space-y-5">
                  <h3 className="font-bold text-base">Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Controller
                      name="name"
                      control={control}
                      rules={{
                        required: "Full name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters",
                        },
                      }}
                      render={({ field }) => (
                        <FormField
                          label="Full Name"
                          error={errors.name?.message}
                        >
                          <Input
                            {...field}
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Email Address">
                          <Input
                            {...field}
                            disabled
                            className="h-10 bg-muted/10 opacity-60 cursor-not-allowed"
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="image"
                      control={control}
                      rules={{
                        validate: (value) => {
                          if (!value) return true;
                          try {
                            new URL(normalizeUrl(value));
                            return true;
                          } catch (_) {
                            return "Please enter a valid URL";
                          }
                        },
                      }}
                      render={({ field }) => (
                        <FormField
                          label="Avatar Image URL"
                          error={errors.image?.message}
                        >
                          <Input
                            type="text"
                            placeholder="https://..."
                            {...field}
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                  </div>
                </section>

                <div className="border-t" />

                <section className="space-y-5">
                  <h3 className="font-bold text-base">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Controller
                      name="phone"
                      control={control}
                      rules={{
                        validate: (value) => {
                          if (!value) return true;
                          const phonePattern = /^[+]?[\d\s()-]{7,15}$/;
                          return (
                            phonePattern.test(value) ||
                            "Please enter a valid phone number"
                          );
                        },
                      }}
                      render={({ field }) => (
                        <FormField
                          label="Phone Number"
                          error={errors.phone?.message}
                        >
                          <Input
                            type="tel"
                            placeholder="+880..."
                            {...field}
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="dateOfBirth"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Date of Birth">
                          <Input
                            type="date"
                            {...field}
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="bloodGroup"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Blood Group">
                          <Input
                            {...field}
                            placeholder="A+, B+, O+, AB+, etc."
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Gender">
                          <ComboboxFilter
                            options={GENDER_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select gender"
                            width="w-full"
                            contentWidth="w-[200px]"
                            searchable={false}
                          />
                        </FormField>
                      )}
                    />
                  </div>
                </section>

                <div className="border-t" />

                <section className="space-y-5">
                  <h3 className="font-bold text-base">Address</h3>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <FormField label="Full Address">
                        <Textarea
                          rows={3}
                          placeholder="Enter your complete address..."
                          {...field}
                          className="bg-muted/10 resize-none"
                          disabled={isSubmitting}
                        />
                      </FormField>
                    )}
                  />
                </section>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
