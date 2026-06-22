"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Container from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Stethoscope,
  Building2,
  Star,
  CalendarDays,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Award,
  DollarSign,
  MessageSquare,
  Activity,
  HeartPulse,
  Briefcase,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// doctor details skeleton
function DoctorDetailsSkeleton() {
  return (
    <div className="py-12 lg:py-16 bg-muted/40 min-h-screen">
      <Container>
        <Skeleton className="h-6 w-32 mb-8 rounded-md" />

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Left Column - Doctor Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Card Skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row gap-6">
              <Skeleton className="h-36 w-36 sm:h-40 sm:w-40 rounded-2xl shrink-0 mx-auto sm:mx-0" />

              <div className="flex-1 space-y-3">
                {/* specialization + rating row */}
                <div className="flex gap-3">
                  <Skeleton className="h-7 w-32 rounded-md" />
                  <Skeleton className="h-7 w-24 rounded-lg" />
                </div>

                {/* doctor name */}
                <Skeleton className="h-9 w-3/4 rounded-md" />

                {/* qualification */}
                <Skeleton className="h-5 w-1/2 rounded-md" />

                {/* hospital */}
                <Skeleton className="h-5 w-2/3 rounded-md" />

                {/* experience */}
                <Skeleton className="h-5 w-44 rounded-md" />
              </div>
            </div>

            {/* Reviews Section Skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Skeleton className="h-7 w-48 mb-4 rounded-md" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-muted/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="rounded-2xl border border-border bg-card shadow-md lg:sticky lg:top-6 overflow-hidden">
            {/* Fee header */}
            <div className="bg-secondary p-5">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 rounded-md bg-secondary-foreground/20" />
                  <Skeleton className="h-8 w-28 rounded-md bg-secondary-foreground/20" />
                </div>
                <Skeleton className="h-8 w-28 rounded-xl bg-secondary-foreground/20" />
              </div>
            </div>

            {/* Form content */}
            <div className="p-6 space-y-6">
              {/* Work Days */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-md" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-12 rounded-full" />
                  <Skeleton className="h-8 w-12 rounded-full" />
                  <Skeleton className="h-8 w-12 rounded-full" />
                  <Skeleton className="h-8 w-12 rounded-full" />
                </div>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-32 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-28 rounded-md" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>

              {/* Symptoms Textarea */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-36 rounded-md" />
                <Skeleton className="h-22.5 w-full rounded-xl" />
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [appointmentDate, setAppointmentDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const isAvailableDay = (date) => {
    if (!doctor?.availableDays?.length) return false;
    return doctor.availableDays.some((day) => dayMap[day] === date.getDay());
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    async function fetchDoctor() {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/${id}`,
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Doctor not found");
        }

        setDoctor(data.doctor || data);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDoctor();
    }
  }, [id]);

  useEffect(() => {
    if (!appointmentDate || !doctor?._id) return;

    async function fetchAvailableSlots() {
      try {
        setLoadingSlots(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/available-slots?doctorId=${doctor._id}&date=${formatDate(appointmentDate)}`,
        );
        const data = await res.json();
        setAvailableSlots(data.availableSlots || []);
        setAppointmentTime("");
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailableSlots();
  }, [appointmentDate, doctor?._id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentDate || !appointmentTime || !symptoms.trim()) return;

    setBookingLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            doctorId: id,
            appointmentDate: formatDate(appointmentDate),
            appointmentTime,
            symptoms: symptoms.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create appointment");
      }

      if (data?.stripeSessionUrl) {
        window.location.href = data.stripeSessionUrl;
      } else {
        router.push(
          `/dashboard/patient/payment?appointmentId=${data?.appointment?._id || data?._id}`,
        );
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <DoctorDetailsSkeleton />;

  if (error || !doctor) {
    return (
      <div className="py-20 text-center bg-muted/40 min-h-screen flex flex-col justify-center items-center">
        <p className="text-destructive font-semibold text-lg mb-4">
          Error: {error || "Profile data missing"}
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/doctors" className="gap-2">
            <ArrowLeft size={16} />
            Return to Find Doctors
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="py-12 lg:py-16 min-h-screen overflow-x-hidden">
      <Container>
        <div className="mb-6">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Find Doctors
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row gap-6 relative overflow-hidden"
            >
              {/* Doctor image */}
              <div className="relative h-36 w-36 sm:h-40 sm:w-40 bg-muted rounded-2xl overflow-hidden shrink-0 mx-auto sm:mx-0 border border-border">
                <Image
                  src={doctor.profileImage}
                  alt={doctor.doctorName}
                  fill
                  sizes="160px"
                  className="object-cover object-top"
                  unoptimized
                />
              </div>

              <div className="flex flex-col justify-center flex-1 text-center sm:text-left">
                {/* specialization + rating */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    <Stethoscope size={13} />
                    {doctor.specialization}
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {doctor.rating ? doctor.rating.toFixed(1) : "New"}
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  {doctor.doctorName}
                  {doctor.verificationStatus?.toLowerCase() === "verified" ? (
                    <ShieldCheck
                      size={22}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <ShieldAlert
                      size={22}
                      className="text-amber-500 shrink-0"
                    />
                  )}
                </h1>

                <p className="text-sm font-medium text-primary mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Award size={15} />
                  {doctor.qualifications}
                </p>

                {/* Hospital */}
                <p className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-3 text-sm">
                  <Building2 size={16} className="text-muted-foreground/70" />
                  {doctor.hospitalName}
                </p>

                {/* Experience without pill */}
                <p className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-2 text-sm">
                  <Briefcase size={16} className="text-muted-foreground/70" />
                  {doctor.experience} Years Experience
                </p>
              </div>
            </motion.section>

            {/* Reviews Section */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-xs"
            >
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                Patient Testimonials ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl bg-muted/30">
                  <HeartPulse
                    className="mx-auto text-muted-foreground/40 mb-2"
                    size={32}
                  />
                  <p className="text-sm text-muted-foreground font-medium">
                    No verification evaluations logged yet for this clinician.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 rounded-xl border border-border bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({
                            length: Math.round(rev.rating || 5),
                          }).map((_, i) => (
                            <Star key={i} size={14} className="fill-current" />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        &quot;{rev.reviewText}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>

          {/* Right Sidebar */}
          <motion.aside
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 28,
              delay: 0.15,
            }}
            className="rounded-2xl border border-border bg-card shadow-xs lg:sticky lg:top-6 overflow-hidden"
          >
            <div className="bg-secondary p-5 text-secondary-foreground">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">
                    Consultation Fee
                  </p>
                  <p className="text-2xl font-extrabold flex items-center mt-0.5">
                    <DollarSign
                      size={20}
                      className="text-secondary-foreground shrink-0"
                    />
                    {doctor.consultationFee}
                  </p>
                </div>
                <div className="bg-secondary-foreground/10 border border-secondary-foreground/20 rounded-xl px-3 py-2 text-xs font-semibold">
                  Stripe Secured
                </div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                {/* work days */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <CalendarDays size={14} />
                    Work Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {doctor.availableDays?.map((day) => (
                      <span
                        key={day}
                        className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
                      >
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* date picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <CalendarDays size={14} />
                    Choose Appointment Date
                  </label>

                  <div className="relative w-full">
                    <style jsx global>{`
                      .react-datepicker-wrapper {
                        width: 100%;
                      }
                      .react-datepicker__input-container {
                        width: 100%;
                      }
                    `}</style>

                    <DatePicker
                      selected={appointmentDate}
                      onChange={(date) => setAppointmentDate(date)}
                      filterDate={isAvailableDay}
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="dd/mm/yyyy"
                      className="w-full h-11 rounded-xl border border-border bg-background px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    <CalendarDays
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                  </div>
                </div>

                {/* available slots */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Clock size={14} />
                    Choose Available Slot
                  </label>
                  {loadingSlots ? (
                    <p className="text-xs text-muted-foreground">
                      Loading slots...
                    </p>
                  ) : !appointmentDate ? (
                    <p className="text-xs text-muted-foreground">
                      Select a date to see available slots.
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-red-500 font-semibold">
                      No slots available for selected date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setAppointmentTime(slot)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            appointmentTime === slot
                              ? "bg-secondary text-secondary-foreground border-secondary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* symptoms */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Activity size={14} />
                    Describe Current Symptoms
                  </label>
                  <Textarea
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Provide a brief summary of symptoms..."
                    className="min-h-22.5 rounded-xl resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={
                    !appointmentDate ||
                    !appointmentTime ||
                    !symptoms.trim() ||
                    bookingLoading
                  }
                  className="w-full h-12 rounded-lg font-bold"
                >
                  {bookingLoading
                    ? "Processing Transaction..."
                    : "Proceed to Secure Payment"}
                </Button>
              </form>
            </div>
          </motion.aside>
        </div>
      </Container>
    </main>
  );
}
