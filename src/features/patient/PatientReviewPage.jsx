"use client";
import { useEffect, useState, useRef, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  Edit,
  Trash2,
  Plus,
  Stethoscope,
  Calendar,
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken, formatDate } from "@/lib/admin-utils";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ComboboxFilter from "@/components/shared/ComboboxFilter";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const globalCache = {
  userId: null,
  reviews: null,
  doctors: null,
  doctorNames: {},
};

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

const StarRating = ({ rating, onRate, interactive = false, size = "md" }) => {
  const [hovered, setHovered] = useState(0);
  const sizeClass =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating" : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          aria-label={
            interactive ? `${star} star${star !== 1 ? "s" : ""}` : undefined
          }
          aria-pressed={interactive ? rating === star : undefined}
          className={`${
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
          } transition-transform`}
        >
          <Star
            className={`${sizeClass} ${
              star <= (hovered || rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/30"
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
};

function useReviewsData(session) {
  const [dataState, setDataState] = useState({
    loading: false,
    error: null,
    reviews: [],
    doctorNames: {},
  });

  const [doctors, setDoctors] = useState([]);

  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sessionId = session?.user?.id || session?.user?._id;

  const fetchDoctors = useCallback(async () => {
    if (globalCache.doctors) {
      setDoctors(globalCache.doctors);
      return;
    }

    try {
      const token = await fetchAuthToken();
      const data = await apiRequest("/doctors?limit=200", token);
      const doctorsArray = Array.isArray(data)
        ? data
        : data?.doctors || data?.data || [];

      globalCache.doctors = doctorsArray;
      if (mountedRef.current) {
        setDoctors(doctorsArray);
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  }, []);

  const fetchDoctorName = useCallback(async (token, doctorId) => {
    if (!doctorId) return "Unknown Doctor";
    if (globalCache.doctorNames[doctorId])
      return globalCache.doctorNames[doctorId];
    try {
      const doctor = await apiRequest(`/doctors/${doctorId}`, token);
      const name = doctor.doctorName || doctor.name || "Unknown Doctor";
      globalCache.doctorNames[doctorId] = name;
      return name;
    } catch {
      return "Unknown Doctor";
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!sessionId || fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;

    try {
      const token = await fetchAuthToken();
      const data = await apiRequest(`/reviews?patientId=${sessionId}`, token);

      if (!mountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      const myReviews = Array.isArray(data)
        ? data
        : data?.reviews || data?.data || [];

      const doctorIds = [
        ...new Set(myReviews.map((r) => r.doctorId).filter(Boolean)),
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

      globalCache.reviews = myReviews;
      globalCache.doctorNames = {
        ...globalCache.doctorNames,
        ...doctorNamesMap,
      };

      setDataState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        reviews: myReviews,
        doctorNames: { ...prev.doctorNames, ...doctorNamesMap },
      }));
    } catch (err) {
      if (!mountedRef.current) {
        fetchInProgressRef.current = false;
        return;
      }

      const message = err.message || "Failed to load reviews";
      setDataState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    } finally {
      if (mountedRef.current) {
        fetchInProgressRef.current = false;
      }
    }
  }, [sessionId, fetchDoctorName]);

  const refreshData = useCallback(async () => {
    fetchInProgressRef.current = false;
    await fetchReviews();
  }, [fetchReviews]);

  return {
    ...dataState,
    setDataState,
    doctors,
    fetchDoctors,
    fetchReviews,
    refreshData,
  };
}

export default function PatientReviewsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const formTitleId = useId();

  const {
    loading,
    error,
    reviews,
    doctorNames,
    setDataState,
    doctors,
    fetchDoctors,
    fetchReviews,
    refreshData,
  } = useReviewsData(session);

  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: "",
    doctorName: "",
    rating: 0,
    reviewText: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const sessionId = session?.user?.id || session?.user?._id;

  useEffect(() => {
    document.body.style.overflow = showForm ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm]);

  useEffect(() => {
    if (sessionLoading || !sessionId) return;

    if (globalCache.userId !== sessionId) {
      globalCache.userId = sessionId;
      globalCache.reviews = null;
      globalCache.doctorNames = {};
      setDataState({
        loading: true,
        error: null,
        reviews: [],
        doctorNames: {},
      });
    } else if (globalCache.reviews) {
      setDataState({
        loading: false,
        error: null,
        reviews: globalCache.reviews,
        doctorNames: globalCache.doctorNames,
      });
    }

    Promise.all([fetchReviews(), fetchDoctors()]);
  }, [sessionId, sessionLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAddForm = () => {
    setEditingReview(null);
    setFormData({ doctorId: "", doctorName: "", rating: 0, reviewText: "" });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (review) => {
    setEditingReview(review);
    setFormData({
      doctorId: review.doctorId || "",
      doctorName: "",
      rating: review.rating || 0,
      reviewText: review.reviewText || review.text || "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDoctorSelect = (doctor) => {
    setFormData((prev) => ({
      ...prev,
      doctorId: doctor._id || doctor.id,
      doctorName: doctor.doctorName || doctor.name,
    }));
    setFormErrors((prev) => ({ ...prev, doctorId: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    if (!editingReview && !formData.doctorId) {
      errors.doctorId = "Please select a doctor";
    }
    if (!formData.rating || formData.rating === 0) {
      errors.rating = "Please provide a rating";
    }
    if (!formData.reviewText || formData.reviewText.trim().length < 5) {
      errors.reviewText = "Review must be at least 5 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const token = await fetchAuthToken();

      const payload = {
        doctorId: formData.doctorId,
        rating: formData.rating,
        reviewText: formData.reviewText.trim(),
        patientId: sessionId,
      };

      if (editingReview) {
        await apiRequest(
          `/reviews/${editingReview._id || editingReview.id}`,
          token,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        toast.success("Review updated successfully!");
      } else {
        await apiRequest("/reviews", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Review submitted successfully!");
      }

      setShowForm(false);
      setEditingReview(null);
      await refreshData();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to save review");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleteSubmitting(true);
    try {
      const token = await fetchAuthToken();

      await apiRequest(
        `/reviews/${deleteTarget._id || deleteTarget.id}`,
        token,
        { method: "DELETE" },
      );

      toast.success("Review deleted successfully!");
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
      await refreshData();
    } catch (err) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const doctorOptions = doctors.map((doctor) => ({
    value: doctor._id || doctor.id,
    label: doctor.doctorName || doctor.name,
  }));

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
            Failed to load reviews
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const isLoading = sessionLoading || loading;

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
                <h1 className="text-3xl font-bold tracking-tight">
                  My Reviews
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your doctor reviews and ratings
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={openAddForm}
              disabled={isLoading}
              className="gap-2 shadow-xs"
            >
              <Plus size={16} aria-hidden="true" /> Add Review
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="rounded-xl border border-muted/40 p-6 shadow-xs ring-0"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-20 rounded-lg" />
                  <div className="space-y-2 border-l-2 border-muted pl-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card className="rounded-2xl border border-muted/40 shadow-xs ring-0">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-muted rounded-full">
                  <MessageSquare
                    className="h-12 w-12 text-muted-foreground/70"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-muted-foreground font-medium text-lg mt-2">
                  No reviews yet
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Share your experience with doctors you&apos;ve visited. Your
                  reviews help others make informed decisions.
                </p>
                <Button onClick={openAddForm} className="mt-2 gap-2 shadow-xs">
                  <Plus size={16} aria-hidden="true" /> Write Your First Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((review) => (
              <motion.div
                key={review._id || review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card className="group relative overflow-hidden rounded-xl border border-muted/40 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-sm ring-0">
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          <Stethoscope className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="font-semibold text-foreground tracking-tight truncate">
                            {doctorNames[review.doctorId] || "Loading..."}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar
                              className="h-3.5 w-3.5 text-muted-foreground/60"
                              aria-hidden="true"
                            />
                            <span>
                              {formatDate(review.createdAt || review.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(review)}
                          aria-label="Edit review"
                          className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit size={14} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteTarget(review);
                            setDeleteDialogOpen(true);
                          }}
                          aria-label="Delete review"
                          className="h-8 w-8 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1 w-fit border border-muted/20">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 border-l border-muted/60 pl-1.5">
                        {review.rating}.0
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 border-l-2 border-primary/20 pl-3.5 py-0.5">
                      <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4">
                        &quot;{review.reviewText || review.text || "No comment"}
                        &quot;
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!formSubmitting) {
                  setShowForm(false);
                  setEditingReview(null);
                }
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={formTitleId}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-background border border-border w-full max-w-lg p-6 rounded-xl shadow-lg z-10 space-y-4"
            >
              <div className="space-y-2">
                <h2
                  id={formTitleId}
                  className="text-lg font-semibold tracking-tight"
                >
                  {editingReview ? "Edit Review" : "Write a Review"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {editingReview
                    ? "Update your review for this doctor"
                    : "Share your experience with a doctor"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!editingReview && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Doctor{" "}
                      <span className="text-destructive" aria-hidden="true">
                        *
                      </span>
                    </Label>
                    <ComboboxFilter
                      options={doctorOptions}
                      value={formData.doctorId}
                      onChange={(val) => {
                        const doctor = doctors.find(
                          (d) => (d._id || d.id) === val,
                        );
                        if (doctor) handleDoctorSelect(doctor);
                      }}
                      placeholder="Search for a doctor..."
                      icon={Stethoscope}
                      width="w-full"
                      searchable={true}
                      searchPlaceholder="Type doctor name..."
                      contentWidth="w-[320px]"
                    />
                    {formErrors.doctorId && (
                      <p className="text-xs text-destructive" role="alert">
                        {formErrors.doctorId}
                      </p>
                    )}
                  </div>
                )}

                {editingReview && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-muted/40">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Stethoscope
                        className="h-5 w-5 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {doctorNames[editingReview.doctorId] || "Doctor"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Editing existing review
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Rating{" "}
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={formData.rating}
                      onRate={(rating) =>
                        setFormData((prev) => ({ ...prev, rating }))
                      }
                      interactive
                      size="lg"
                    />
                    {formData.rating > 0 && (
                      <span className="text-sm font-semibold text-amber-600">
                        {formData.rating} / 5
                      </span>
                    )}
                  </div>
                  {formErrors.rating && (
                    <p className="text-xs text-destructive" role="alert">
                      {formErrors.rating}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="review-text" className="text-sm font-medium">
                    Your Review{" "}
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <Textarea
                    id="review-text"
                    placeholder="Describe your experience with this doctor..."
                    rows={4}
                    value={formData.reviewText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reviewText: e.target.value,
                      }))
                    }
                    className="bg-background border-border border resize-none focus-visible:ring-1"
                  />
                  {formErrors.reviewText && (
                    <p className="text-xs text-destructive" role="alert">
                      {formErrors.reviewText}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReview(null);
                    }}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="gap-2 shadow-xs"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2
                          size={14}
                          className="animate-spin"
                          aria-hidden="true"
                        />{" "}
                        Saving...
                      </>
                    ) : editingReview ? (
                      <>
                        <Edit size={14} aria-hidden="true" /> Update Review
                      </>
                    ) : (
                      <>
                        <Star size={14} aria-hidden="true" /> Submit Review
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
        onConfirm={handleDelete}
        loading={deleteSubmitting}
      />
    </>
  );
}
