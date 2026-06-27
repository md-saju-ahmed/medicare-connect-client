"use client";
import { useEffect, useState } from "react";
import { Clock, Loader2, Save, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { Checkbox } from "@/components/ui/checkbox";
import ComboboxFilter from "@/components/shared/ComboboxFilter";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const DAYS_OF_WEEK = [
  { key: "Mon", label: "Mon" },
  { key: "Tue", label: "Tue" },
  { key: "Wed", label: "Wed" },
  { key: "Thu", label: "Thu" },
  { key: "Fri", label: "Fri" },
  { key: "Sat", label: "Sat" },
  { key: "Sun", label: "Sun" },
];

function generateTimeSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      const time24 = `${h}:${m}`;
      const period = hour < 12 ? "AM" : "PM";
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      slots.push({ value: time24, label: `${hour12}:${m} ${period}` });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

async function apiRequest(path, token, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
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

function formatTimeDisplay(time24) {
  const [hours, minutes] = time24.split(":");
  const h = parseInt(hours);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${minutes} ${period}`;
}

function SlotChip({ slot, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-xl text-sm font-medium border bg-primary/5 text-foreground border-primary/15"
    >
      <Clock size={14} className="text-primary" />
      <span>{formatTimeDisplay(slot)}</span>
      <button
        type="button"
        onClick={() => onRemove(slot)}
        className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        aria-label={`Remove ${formatTimeDisplay(slot)}`}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function DoctorSchedulesPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user) return;

    const controller = new AbortController();

    async function fetchSchedule() {
      try {
        setError(null);
        const { data: jwtData } = await authClient.token();
        const token = jwtData?.token;
        if (!token)
          throw new Error(
            "No authentication token available. Please log in again.",
          );

        const doctorData = await apiRequest("/doctors/me", token, {
          signal: controller.signal,
        });

        setDoctorProfile(doctorData);
        setSlots(
          Array.isArray(doctorData.availableSlots)
            ? doctorData.availableSlots
            : [],
        );
        setAvailableDays(
          Array.isArray(doctorData.availableDays)
            ? doctorData.availableDays
            : DAYS_OF_WEEK.map((d) => d.key),
        );
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Schedule fetch error:", err);
        setError(err.message || "Failed to load schedule");
        toast.error(err.message || "Failed to load schedule");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchSchedule();
    return () => controller.abort();
  }, [session?.user?.id, sessionLoading]);

  const handleAddSlot = () => {
    if (!selectedTime) return;
    if (slots.includes(selectedTime)) {
      toast.error("That time slot already exists.");
      return;
    }
    setSlots((prev) => [...prev, selectedTime].sort());
    setSelectedTime("");
  };

  const handleRemoveSlot = (slot) => {
    setSlots((prev) => prev.filter((s) => s !== slot));
  };

  const handleDayToggle = (day) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSave = async () => {
    if (!doctorProfile || !session?.user) return;
    setSaving(true);

    try {
      const { data: jwtData } = await authClient.token();
      const token = jwtData?.token;
      if (!token) throw new Error("Authentication token not available");

      const doctorId =
        doctorProfile._id ?? doctorProfile.doctorId ?? doctorProfile.id;
      await apiRequest(`/doctors/${doctorId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ availableSlots: slots, availableDays }),
      });

      setDoctorProfile((prev) => ({
        ...prev,
        availableSlots: slots,
        availableDays,
      }));
      toast.success("Schedule saved successfully!");
    } catch (err) {
      console.error("Schedule save error:", err);
      toast.error(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

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
            Failed to load schedule
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

  const availableTimeOptions = TIME_SLOTS.filter(
    (time) => !slots.includes(time.value),
  );

  const isLoading = sessionLoading || loading;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Manage Schedules</h1>
            <p className="text-muted-foreground mt-1">
              Set your availability and time slots
            </p>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.23 }}
      >
        <Card className="rounded-2xl shadow-xs border-none ring-0 p-0 overflow-visible">
          <CardContent className="p-6 md:p-8 space-y-8">
            {isLoading ? (
              <>
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <Skeleton className="h-6 w-36 mb-1" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-20 rounded-xl" />
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <Skeleton className="h-6 w-48 mb-1" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-32 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Skeleton className="h-10 w-50 rounded-md" />
                    <Skeleton className="h-10 w-28 rounded-md" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-32 rounded-xl" />
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-end">
                  <Skeleton className="h-10 w-40 rounded-xl" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-bold text-base">Available Days</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select the days you are available for appointments
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      {availableDays.length} day
                      {availableDays.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.key}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all duration-200 ${
                          availableDays.includes(day.key)
                            ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                            : "bg-muted/50 text-muted-foreground border-muted-foreground/20 hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={availableDays.includes(day.key)}
                          onCheckedChange={() => handleDayToggle(day.key)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-bold text-base">
                        Available Time Slots
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add time slots for your available days
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      {slots.length} slot{slots.length !== 1 ? "s" : ""}{" "}
                      configured
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <ComboboxFilter
                      options={availableTimeOptions}
                      value={selectedTime}
                      onChange={setSelectedTime}
                      placeholder="Select time slot"
                      icon={Clock}
                      width="w-50"
                      contentWidth="w-[200px]"
                      searchable={false}
                    />
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      disabled={!selectedTime}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      Add Slot
                    </button>
                  </div>

                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No slots configured yet. Add your first slot above.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <AnimatePresence>
                        {slots.map((slot) => (
                          <SlotChip
                            key={slot}
                            slot={slot}
                            onRemove={handleRemoveSlot}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Schedule
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
