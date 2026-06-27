"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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
import { useDoctorContext } from "@/app/dashboard/DashboardContext";
import ComboboxFilter from "@/components/shared/ComboboxFilter";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const SPECIALIZATION_OPTIONS = SPECIALIZATIONS.map((spec) => ({
  value: spec,
  label: spec,
}));

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

const FormField = ({ label, children, error }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

export default function DoctorProfilePage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { user, setUser, doctorProfile, setDoctorProfile } = useDoctorContext();
  const [state, setState] = useState({
    loading: true,
    error: null,
  });

  const fetchedForRef = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      image: "",
      doctorName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      bloodGroup: "",
      gender: "",
      address: "",
      specialization: "",
      licenseNumber: "",
      experience: "",
      consultationFee: "",
      hospitalName: "",
      qualifications: "",
    },
    mode: "onChange",
  });

  const sessionId = session?.user?.id || session?.user?._id;

  const fetchProfile = useCallback(async () => {
    if (!sessionId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const token = await fetchAuthToken();

      const [userData, doctorData] = await Promise.all([
        apiRequest("/users/me", token),
        apiRequest("/doctors/me", token),
      ]);

      setUser(userData);
      setDoctorProfile(doctorData);

      reset({
        image: userData.image ?? "",
        doctorName: doctorData.doctorName ?? userData.name ?? "",
        email: userData.email ?? "",
        phone: userData.phone ?? "",
        dateOfBirth: userData.dateOfBirth
          ? userData.dateOfBirth.split("T")[0]
          : "",
        bloodGroup: userData.bloodGroup ?? "",
        gender: userData.gender ?? "",
        address: userData.address ?? "",
        specialization: doctorData.specialization ?? "",
        licenseNumber: doctorData.licenseNumber ?? "",
        experience: doctorData.experience ?? "",
        consultationFee: doctorData.consultationFee ?? "",
        hospitalName: doctorData.hospitalName ?? "",
        qualifications: doctorData.qualifications ?? "",
      });

      fetchedForRef.current = sessionId;
      setState((prev) => ({ ...prev, loading: false, error: null }));
    } catch (err) {
      const message = err.message || "Failed to load profile";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
      fetchedForRef.current = null;
    }
  }, [sessionId, reset, setUser, setDoctorProfile]);

  useEffect(() => {
    if (sessionLoading || !sessionId) return;
    if (fetchedForRef.current === sessionId) return;
    fetchProfile();
  }, [sessionId, sessionLoading, fetchProfile]);

  const onSubmit = useCallback(
    async (data) => {
      if (!user || !doctorProfile) return;

      try {
        const token = await fetchAuthToken();

        const userId = user._id || user.id;
        const doctorId = doctorProfile._id;
        const normalizedImage = normalizeUrl(data.image || "");

        const userPayload = {
          name: data.doctorName,
          image: normalizedImage,
          phone: data.phone || "",
          address: data.address || "",
          dateOfBirth: data.dateOfBirth || "",
          bloodGroup: data.bloodGroup || "",
          gender: data.gender || "",
        };

        const doctorPayload = {
          profileImage: normalizedImage,
          doctorName: data.doctorName,
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          experience: data.experience ? Number(data.experience) : undefined,
          consultationFee: data.consultationFee
            ? Number(data.consultationFee)
            : undefined,
          hospitalName: data.hospitalName,
          qualifications: data.qualifications,
        };

        // Update both user and doctor records in parallel
        const [updatedUser, updatedDoctor] = await Promise.all([
          apiRequest(`/users/${userId}`, token, {
            method: "PATCH",
            body: JSON.stringify(userPayload),
          }),
          apiRequest(`/doctors/${doctorId}`, token, {
            method: "PATCH",
            body: JSON.stringify(doctorPayload),
          }),
        ]);

        // Update better-auth's session cookie
        await authClient.updateUser({
          name: updatedUser.name ?? data.doctorName,
          image: updatedUser.image ?? normalizedImage,
        });

        setUser((prev) => ({
          ...prev,
          ...updatedUser,
          name: updatedUser.name ?? data.doctorName,
          image: updatedUser.image ?? normalizedImage,
        }));

        setDoctorProfile((prev) => ({
          ...prev,
          ...updatedDoctor,
          doctorName: updatedDoctor.doctorName ?? data.doctorName,
          specialization: updatedDoctor.specialization ?? data.specialization,
          licenseNumber: updatedDoctor.licenseNumber ?? data.licenseNumber,
          experience: updatedDoctor.experience ?? data.experience,
          consultationFee:
            updatedDoctor.consultationFee ?? data.consultationFee,
          hospitalName: updatedDoctor.hospitalName ?? data.hospitalName,
          qualifications: updatedDoctor.qualifications ?? data.qualifications,
        }));

        reset({
          image: updatedUser.image ?? normalizedImage,
          doctorName: updatedUser.name ?? data.doctorName,
          email: updatedUser.email ?? user.email,
          phone: updatedUser.phone ?? data.phone,
          dateOfBirth: updatedUser.dateOfBirth
            ? updatedUser.dateOfBirth.split("T")[0]
            : data.dateOfBirth,
          bloodGroup: updatedUser.bloodGroup ?? data.bloodGroup,
          gender: updatedUser.gender ?? data.gender,
          address: updatedUser.address ?? data.address,
          specialization: updatedDoctor.specialization ?? data.specialization,
          licenseNumber: updatedDoctor.licenseNumber ?? data.licenseNumber,
          experience: updatedDoctor.experience ?? data.experience,
          consultationFee:
            updatedDoctor.consultationFee ?? data.consultationFee,
          hospitalName: updatedDoctor.hospitalName ?? data.hospitalName,
          qualifications: updatedDoctor.qualifications ?? data.qualifications,
        });

        toast.success("Profile updated successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to update profile");
      }
    },
    [user, doctorProfile, reset, setUser, setDoctorProfile],
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
                  Keep your clinical directory listing accurate and up to date
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
              <div className="space-y-8">
                {/* Account Section Skeleton */}
                <div className="space-y-5">
                  <Skeleton className="h-5 w-20" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>
                </div>

                <Skeleton className="h-px w-full" />

                {/* Personal Details Section Skeleton */}
                <div className="space-y-5">
                  <Skeleton className="h-5 w-32" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>

                <Skeleton className="h-px w-full" />

                {/* Professional Details Section Skeleton */}
                <div className="space-y-5">
                  <Skeleton className="h-5 w-36" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>

                <Skeleton className="h-px w-full" />

                {/* Qualifications Section Skeleton */}
                <div className="space-y-5">
                  <Skeleton className="h-5 w-28" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-24 w-full rounded-md" />
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="space-y-5">
                  <h3 className="font-bold text-base">Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Controller
                      name="doctorName"
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
                          error={errors.doctorName?.message}
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

                <div className="border-t" />

                <section className="space-y-5">
                  <h3 className="font-bold text-base">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Controller
                      name="specialization"
                      control={control}
                      rules={{ required: "Specialization is required" }}
                      render={({ field }) => (
                        <FormField
                          label="Specialization"
                          error={errors.specialization?.message}
                        >
                          <ComboboxFilter
                            options={SPECIALIZATION_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select specialization"
                            width="w-full"
                            contentWidth="w-[200px]"
                            searchable={false}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="licenseNumber"
                      control={control}
                      rules={{ required: "License number is required" }}
                      render={({ field }) => (
                        <FormField
                          label="License Number"
                          error={errors.licenseNumber?.message}
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
                      name="experience"
                      control={control}
                      rules={{
                        min: { value: 0, message: "Must be 0 or greater" },
                      }}
                      render={({ field }) => (
                        <FormField
                          label="Years of Experience"
                          error={errors.experience?.message}
                        >
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="consultationFee"
                      control={control}
                      rules={{
                        min: { value: 0, message: "Must be 0 or greater" },
                      }}
                      render={({ field }) => (
                        <FormField
                          label="Consultation Fee (BDT)"
                          error={errors.consultationFee?.message}
                        >
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            className="h-10 bg-muted/10"
                            disabled={isSubmitting}
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      name="hospitalName"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Hospital Name">
                          <Input
                            {...field}
                            placeholder="Enter hospital name"
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
                  <h3 className="font-bold text-base">Qualifications</h3>
                  <Controller
                    name="qualifications"
                    control={control}
                    render={({ field }) => (
                      <FormField label="Qualifications & Certifications">
                        <Textarea
                          rows={4}
                          placeholder="List your qualifications, certifications, and educational background..."
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
