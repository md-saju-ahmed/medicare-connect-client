"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Stethoscope,
  Building2,
  Star,
  Grid3X3,
  List,
  Briefcase,
  SlidersHorizontal,
  BadgeCheck,
} from "lucide-react";

// card skeleton
function DoctorCardSkeleton({ viewMode }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
        viewMode === "list" ? "flex flex-col md:flex-row" : "flex flex-col"
      }`}
    >
      {/* Image */}
      <div
        className={`relative shrink-0 bg-muted ${
          viewMode === "list" ? "h-64 w-full md:h-auto md:w-72" : "h-56 w-full"
        }`}
      >
        <Skeleton className="absolute inset-0 rounded-none" />
        {/* fake verified badge */}
        <Skeleton className="absolute right-3 top-3 h-7 w-24 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
        <div>
          {/* specialization + rating */}
          <div className="mb-3 flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* name */}
          <Skeleton className="mb-4 h-7 w-3/4 rounded-md" />

          {/* hospital */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>

            {/* experience */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>

          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [sortBy, setSortBy] = useState("rating-desc");

  const [viewMode, setViewMode] = useState("grid");

  // search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // fetch doctors
  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      setError("");

      try {
        const queryParams = new URLSearchParams();

        if (debouncedSearch.trim()) {
          queryParams.append("search", debouncedSearch.trim());
        }

        if (specialization !== "all") {
          queryParams.append("specialization", specialization);
        }

        if (sortBy === "rating-desc") {
          queryParams.append("sortBy", "rating");
          queryParams.append("order", "desc");
        } else if (sortBy === "fee-asc") {
          queryParams.append("sortBy", "consultationFee");
          queryParams.append("order", "asc");
        } else if (sortBy === "fee-desc") {
          queryParams.append("sortBy", "consultationFee");
          queryParams.append("order", "desc");
        } else if (sortBy === "experience-desc") {
          queryParams.append("sortBy", "experience");
          queryParams.append("order", "desc");
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/doctors?${queryParams.toString()}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch doctors from server");
        }

        const data = await res.json();
        setDoctors(data?.doctors || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [debouncedSearch, specialization, sortBy]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-muted/40 py-12 lg:py-16">
      <Container>
        <SectionTitle
          title="Find Your Doctor"
          description="Browse trusted specialists and book appointments."
        />

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="grid items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctor or hospital..."
                className="h-11 bg-muted/50 pl-10"
              />
            </div>

            {/* Specialization */}
            <div className="relative">
              <Stethoscope
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="h-11 w-full cursor-pointer rounded-md border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none"
              >
                <option value="all">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="relative">
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 w-full cursor-pointer rounded-md border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none"
              >
                <option value="rating-desc">Highest Rating</option>
                <option value="fee-asc">Fee: Low to High</option>
                <option value="fee-desc">Fee: High to Low</option>
                <option value="experience-desc">Experience: High to Low</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end gap-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "outline"}
                size="icon"
                className="h-11 w-11"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 size={18} />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "outline"}
                size="icon"
                className="h-11 w-11"
                onClick={() => setViewMode("list")}
              >
                <List size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* States & Content */}
        <AnimatePresence mode="wait">
          {/* Loading */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-5"
              }
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <DoctorCardSkeleton key={index} viewMode={viewMode} />
              ))}
            </motion.div>
          )}

          {/* Error */}
          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center font-medium text-destructive"
            >
              Error: {error}
            </motion.div>
          )}

          {/* Empty */}
          {!loading && !error && doctors.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card py-20 text-center shadow-sm"
            >
              <Search
                size={40}
                className="mx-auto mb-3 text-muted-foreground/60"
              />
              <p className="font-medium text-foreground">No doctors found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
            </motion.div>
          )}

          {/* Doctors */}
          {!loading && !error && doctors.length > 0 && (
            <motion.div
              key="doctors"
              layout
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-5"
              }
            >
              <AnimatePresence mode="popLayout">
                {doctors.map((doctor, index) => (
                  <motion.article
                    key={doctor._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      y: { type: "spring", stiffness: 220, damping: 24 },
                      opacity: { duration: 0.2 },
                      layout: { duration: 0.3 },
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                    className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
                      viewMode === "list"
                        ? "flex flex-col md:flex-row"
                        : "flex flex-col"
                    }`}
                  >
                    {/* Image */}
                    <div
                      className={`relative shrink-0 overflow-hidden bg-muted ${
                        viewMode === "list"
                          ? "h-64 w-full md:h-auto md:w-72"
                          : "h-56 w-full"
                      }`}
                    >
                      <Image
                        src={doctor.profileImage}
                        alt={doctor.doctorName}
                        fill
                        sizes="(max-width:768px) 100vw, 33vw"
                        className="object-cover object-top transition duration-500 group-hover:scale-105"
                        unoptimized
                      />

                      {/* Verified Badge */}
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm">
                        <BadgeCheck size={15} className="text-primary" />
                        <span>Verified</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                      <div>
                        {/* Specialization & Ratings */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                            <Stethoscope size={13} />
                            {doctor.specialization}
                          </div>

                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                            <Star
                              size={13}
                              className="fill-amber-400 text-amber-400"
                            />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              {doctor.rating?.toFixed(1) || "0.0"}
                            </span>
                          </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {doctor.doctorName}
                        </h3>

                        {/* Meta */}
                        <div className="mt-3 space-y-2.5">
                          <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Building2 size={16} className="shrink-0" />
                            <span className="truncate">
                              {doctor.hospitalName}
                            </span>
                          </p>

                          <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Briefcase size={16} className="shrink-0" />
                            <span>
                              {doctor.experience || 0} Years Experience
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                        {/* Fee */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Consultation
                          </p>
                          <p className="text-xl font-extrabold text-foreground">
                            ${doctor.consultationFee}
                          </p>
                        </div>

                        {/* Button */}
                        <Button
                          asChild
                          variant="secondary"
                          className="h-11 rounded-lg px-5 font-medium shadow-sm"
                        >
                          <Link href={`/doctors/${doctor._id}`}>
                            Book Appointment
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </main>
  );
}
