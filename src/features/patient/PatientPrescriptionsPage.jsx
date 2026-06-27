"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Stethoscope, CalendarClock, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { fetchAuthToken, formatDate } from "@/lib/admin-utils";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

async function apiRequest(path, token, options = {}) {
  if (!token) throw new Error("No authentication token available");

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP ${res.status}: ${res.statusText}`,
    );
  }

  return res.json();
}

function toArray(data, key) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data[key] && Array.isArray(data[key])) return data[key];
  return [];
}

function PrescriptionCard({ prescription, doctorName }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">
              {doctorName ? `Dr. ${doctorName}` : "Doctor"}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock size={13} />
              {formatDate(prescription.createdAt)}
            </div>
            {prescription.diagnosis && (
              <div className="flex items-center gap-1.5 text-sm">
                <Stethoscope size={13} className="text-primary" />
                {prescription.diagnosis}
              </div>
            )}
          </div>

          {Array.isArray(prescription.medications) &&
            prescription.medications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prescription.medications.map((med, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/15 text-xs font-medium"
                  >
                    <Pill size={12} className="text-primary" />
                    {med.name}
                    {med.dosage ? ` · ${med.dosage}` : ""}
                    {med.frequency ? ` · ${med.frequency}` : ""}
                    {med.duration ? ` · ${med.duration}` : ""}
                  </span>
                ))}
              </div>
            )}

          {prescription.notes && (
            <p className="text-sm text-muted-foreground italic">
              &ldquo;{prescription.notes}&rdquo;
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PatientPrescriptionsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorNames, setDoctorNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const doctorCacheRef = useRef({});

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await fetchAuthToken();

        const prescriptionData = await apiRequest(
          "/prescriptions/mine",
          token,
          {
            signal: controller.signal,
          },
        );

        const list = toArray(prescriptionData, "prescriptions");
        setPrescriptions(list);

        const uniqueDoctorIds = [
          ...new Set(list.map((p) => p.doctorId).filter(Boolean)),
        ].filter((id) => !doctorCacheRef.current[id]);

        if (uniqueDoctorIds.length > 0) {
          const results = await Promise.allSettled(
            uniqueDoctorIds.map((id) =>
              apiRequest(`/doctors/${id}`, token, {
                signal: controller.signal,
              }),
            ),
          );

          const updated = { ...doctorCacheRef.current };
          results.forEach((result, i) => {
            if (result.status === "fulfilled" && result.value) {
              updated[uniqueDoctorIds[i]] = result.value.doctorName || "Doctor";
            }
          });
          doctorCacheRef.current = updated;
          setDoctorNames(updated);
        } else {
          setDoctorNames({ ...doctorCacheRef.current });
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Prescriptions fetch error:", err);
        setError(err.message || "Failed to load prescriptions");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAll();

    return () => controller.abort();
  }, [userId]);

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
          <p className="text-destructive font-semibold text-lg mb-2">
            Failed to load prescriptions
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">My Prescriptions</h1>
            <p className="text-muted-foreground mt-1">
              Diagnoses, medications, and notes from your doctors
            </p>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">
            {loading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              `${prescriptions.length} Prescription${prescriptions.length === 1 ? "" : "s"}`
            )}
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <Card className="rounded-2xl border-none shadow-xs ring-0">
            <CardContent className="p-10 text-center text-muted-foreground">
              <ClipboardList size={28} className="mx-auto mb-3 opacity-50" />
              No prescriptions yet. Your doctor will add one here after a
              completed appointment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription._id}
                  prescription={prescription}
                  doctorName={doctorNames[prescription.doctorId]}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
}
