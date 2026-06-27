"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Plus,
  X,
  Pencil,
  Save,
  Pill,
  Stethoscope,
  CalendarClock,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import ComboboxFilter from "@/components/shared/ComboboxFilter";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const PRESCRIBABLE_STATUSES = ["accepted", "completed"];

const emptyMedication = () => ({
  id: crypto.randomUUID(),
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
});

async function apiRequest(path, token, options = {}) {
  if (!token) throw new Error("No authentication token available");

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

async function getAuthToken() {
  const { data: jwtData } = await authClient.token();
  const tok = jwtData?.token;
  if (!tok)
    throw new Error("No authentication token available. Please log in again.");
  return tok;
}

function toArray(data, key) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data[key] && Array.isArray(data[key])) return data[key];
  return [];
}

function patientLabel(idOrRecord) {
  const patientId =
    typeof idOrRecord === "string" ? idOrRecord : idOrRecord?.patientId;
  if (!patientId) return "Unknown patient";
  return `Patient #${String(patientId).slice(-6)}`;
}

function appointmentLabel(appointment) {
  if (!appointment) return "Unlinked appointment";
  const date = appointment.appointmentDate || "No date";
  const time = appointment.appointmentTime || "No time";
  return `${patientLabel(appointment)} · ${date} · ${time}`;
}

function MedicationRow({ medication, onChange, onRemove, removable }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2 items-end">
      <Input
        placeholder="Medication name"
        value={medication.name}
        onChange={(e) => onChange(medication.id, "name", e.target.value)}
        className="h-10"
      />
      <Input
        placeholder="Dosage (e.g. 500mg)"
        value={medication.dosage}
        onChange={(e) => onChange(medication.id, "dosage", e.target.value)}
        className="h-10"
      />
      <Input
        placeholder="Frequency (e.g. 2x/day)"
        value={medication.frequency}
        onChange={(e) => onChange(medication.id, "frequency", e.target.value)}
        className="h-10"
      />
      <Input
        placeholder="Duration (e.g. 7 days)"
        value={medication.duration}
        onChange={(e) => onChange(medication.id, "duration", e.target.value)}
        className="h-10"
      />
      <button
        type="button"
        onClick={() => onRemove(medication.id)}
        disabled={!removable}
        className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Remove medication"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function PrescriptionForm({
  appointments,
  form,
  onFieldChange,
  onMedicationChange,
  onAddMedication,
  onRemoveMedication,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
  lockedAppointmentLabel,
}) {
  const appointmentOptions = appointments.map((a) => ({
    value: a._id,
    label: appointmentLabel(a),
  }));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Patient / Appointment</Label>
          {lockedAppointmentLabel ? (
            <div className="h-10 flex items-center px-3 rounded-lg border bg-muted/40 text-sm text-muted-foreground">
              {lockedAppointmentLabel}
            </div>
          ) : (
            <ComboboxFilter
              options={appointmentOptions}
              value={form.appointmentId}
              onChange={(value) => onFieldChange("appointmentId", value)}
              placeholder={
                appointments.length === 0
                  ? "No eligible appointments"
                  : "Select an appointment"
              }
              icon={CalendarClock}
              width="w-full"
              contentWidth="w-[320px]"
              searchable={true}
              searchPlaceholder="Search appointments..."
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Diagnosis</Label>
          <Input
            placeholder="e.g. Seasonal allergic rhinitis"
            value={form.diagnosis}
            onChange={(e) => onFieldChange("diagnosis", e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Medications</Label>
          <button
            type="button"
            onClick={onAddMedication}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors"
          >
            <Plus size={14} />
            Add Medication
          </button>
        </div>

        <div className="space-y-2">
          {form.medications.map((med) => (
            <MedicationRow
              key={med.id}
              medication={med}
              onChange={onMedicationChange}
              onRemove={onRemoveMedication}
              removable={form.medications.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Additional Notes</Label>
        <Textarea
          rows={3}
          placeholder="Follow-up instructions, dietary advice, warnings..."
          value={form.notes}
          onChange={(e) => onFieldChange("notes", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function PrescriptionCard({
  prescription,
  appointment,
  isEditing,
  onEditToggle,
  children,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                {patientLabel(prescription)}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock size={13} />
                {appointment
                  ? `${appointment.appointmentDate} · ${appointment.appointmentTime}`
                  : "Linked appointment unavailable"}
              </div>
              {prescription.diagnosis && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Stethoscope size={13} className="text-primary" />
                  {prescription.diagnosis}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onEditToggle(prescription)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Edit prescription"
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>

          {isEditing ? (
            children
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DoctorPrescriptionsPageContent() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const [doctorData, setDoctorData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createForm, setCreateForm] = useState({
    appointmentId: "",
    diagnosis: "",
    medications: [emptyMedication()],
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const doctorId = doctorData?._id ?? null;

  const searchParams = useSearchParams();
  const prefillAppointmentId = searchParams.get("appointmentId");
  const prefillPatientId = searchParams.get("patientId");

  const [appliedPrefillId, setAppliedPrefillId] = useState(null);

  const prefillMatch =
    prefillAppointmentId && appointments.length > 0
      ? appointments.find((a) => a._id === prefillAppointmentId)
      : null;

  if (prefillMatch && appliedPrefillId !== prefillMatch._id) {
    setAppliedPrefillId(prefillMatch._id);
    setCreateForm((prev) => ({
      ...prev,
      appointmentId: prefillMatch._id,
    }));
  }

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const tok = await getAuthToken();
        const profile = await apiRequest("/doctors/me", tok, {
          signal: controller.signal,
        });
        const id = profile._id;

        const [appointmentData, prescriptionData] = await Promise.all([
          apiRequest(`/appointments?doctorId=${id}`, tok, {
            signal: controller.signal,
          }),
          apiRequest(`/prescriptions?doctorId=${id}`, tok, {
            signal: controller.signal,
          }),
        ]);

        setDoctorData(profile);
        setAppointments(toArray(appointmentData, "appointments"));
        setPrescriptions(toArray(prescriptionData, "prescriptions"));
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

  const eligibleAppointments = appointments.filter((a) =>
    PRESCRIBABLE_STATUSES.includes(a.appointmentStatus),
  );

  const appointmentMap = Object.fromEntries(
    appointments.map((a) => [a._id, a]),
  );

  const updateCreateField = (field, value) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }));

  const updateCreateMedication = (id, field, value) =>
    setCreateForm((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    }));

  const addCreateMedication = () =>
    setCreateForm((prev) => ({
      ...prev,
      medications: [...prev.medications, emptyMedication()],
    }));

  const removeCreateMedication = (id) =>
    setCreateForm((prev) => ({
      ...prev,
      medications:
        prev.medications.length > 1
          ? prev.medications.filter((m) => m.id !== id)
          : prev.medications,
    }));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!createForm.appointmentId) {
      toast.error("Select an appointment to identify the patient.");
      return;
    }

    const appointment = appointmentMap[createForm.appointmentId];
    const validMedications = createForm.medications
      .filter((m) => m.name.trim())
      .map(({ id, ...rest }) => rest);

    if (validMedications.length === 0) {
      toast.error("Add at least one medication.");
      return;
    }

    setCreating(true);

    try {
      const tok = await getAuthToken();

      const payload = {
        doctorId,
        patientId: appointment?.patientId,
        appointmentId: createForm.appointmentId,
        diagnosis: createForm.diagnosis,
        medications: validMedications,
        notes: createForm.notes,
      };

      const result = await apiRequest("/prescriptions", tok, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setPrescriptions((prev) => [
        { ...payload, _id: result.insertedId ?? crypto.randomUUID() },
        ...prev,
      ]);

      setCreateForm({
        appointmentId: "",
        diagnosis: "",
        medications: [emptyMedication()],
        notes: "",
      });

      toast.success("Prescription created successfully.");
    } catch (err) {
      console.error("Create prescription error:", err);
      toast.error(err.message || "Failed to create prescription");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (prescription) => {
    setEditingId(prescription._id);
    setEditForm({
      diagnosis: prescription.diagnosis ?? "",
      notes: prescription.notes ?? "",
      medications:
        Array.isArray(prescription.medications) &&
        prescription.medications.length > 0
          ? prescription.medications.map((m) => ({
              id: crypto.randomUUID(),
              name: m.name ?? "",
              dosage: m.dosage ?? "",
              frequency: m.frequency ?? "",
              duration: m.duration ?? "",
            }))
          : [emptyMedication()],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const updateEditField = (field, value) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const updateEditMedication = (id, field, value) =>
    setEditForm((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    }));

  const addEditMedication = () =>
    setEditForm((prev) => ({
      ...prev,
      medications: [...prev.medications, emptyMedication()],
    }));

  const removeEditMedication = (id) =>
    setEditForm((prev) => ({
      ...prev,
      medications:
        prev.medications.length > 1
          ? prev.medications.filter((m) => m.id !== id)
          : prev.medications,
    }));

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const validMedications = editForm.medications
      .filter((m) => m.name.trim())
      .map(({ id, ...rest }) => rest);

    if (validMedications.length === 0) {
      toast.error("Add at least one medication.");
      return;
    }

    setEditSubmitting(true);

    try {
      const tok = await getAuthToken();

      const payload = {
        diagnosis: editForm.diagnosis,
        notes: editForm.notes,
        medications: validMedications,
      };

      await apiRequest(`/prescriptions/${editingId}`, tok, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setPrescriptions((prev) =>
        prev.map((p) => (p._id === editingId ? { ...p, ...payload } : p)),
      );
      cancelEdit();
      toast.success("Prescription updated successfully.");
    } catch (err) {
      console.error("Update prescription error:", err);
      toast.error(err.message || "Failed to update prescription");
    } finally {
      setEditSubmitting(false);
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
            <h1 className="text-3xl font-bold">Prescription Management</h1>
            <p className="text-muted-foreground mt-1">
              Write and manage prescriptions for your patients
            </p>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-2xl shadow-xs border-none ring-0 p-0">
          <CardContent className="p-6 md:p-8 space-y-5">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-primary" />
                  <h3 className="font-bold text-base">New Prescription</h3>
                </div>

                {eligibleAppointments.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No accepted or completed appointments available to prescribe
                    for yet.
                  </p>
                )}

                <PrescriptionForm
                  appointments={eligibleAppointments}
                  form={createForm}
                  onFieldChange={updateCreateField}
                  onMedicationChange={updateCreateMedication}
                  onAddMedication={addCreateMedication}
                  onRemoveMedication={removeCreateMedication}
                  onSubmit={handleCreateSubmit}
                  submitting={creating}
                  submitLabel="Create Prescription"
                  lockedAppointmentLabel={
                    prefillAppointmentId && appointmentMap[prefillAppointmentId]
                      ? appointmentLabel(appointmentMap[prefillAppointmentId])
                      : prefillAppointmentId && prefillPatientId
                        ? patientLabel(prefillPatientId)
                        : undefined
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
              <Pill size={28} className="mx-auto mb-3 opacity-50" />
              No prescriptions written yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription._id}
                  prescription={prescription}
                  appointment={appointmentMap[prescription.appointmentId]}
                  isEditing={editingId === prescription._id}
                  onEditToggle={
                    editingId === prescription._id ? cancelEdit : startEdit
                  }
                >
                  {editForm && (
                    <PrescriptionForm
                      appointments={eligibleAppointments}
                      form={editForm}
                      onFieldChange={updateEditField}
                      onMedicationChange={updateEditMedication}
                      onAddMedication={addEditMedication}
                      onRemoveMedication={removeEditMedication}
                      onSubmit={handleEditSubmit}
                      submitting={editSubmitting}
                      submitLabel="Save Changes"
                      onCancel={cancelEdit}
                      lockedAppointmentLabel={appointmentLabel(
                        appointmentMap[prescription.appointmentId],
                      )}
                    />
                  )}
                </PrescriptionCard>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
}

function DoctorPrescriptionsPageFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-9 w-64 rounded-md" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export default function DoctorPrescriptionsPage() {
  return (
    <Suspense fallback={<DoctorPrescriptionsPageFallback />}>
      <DoctorPrescriptionsPageContent />
    </Suspense>
  );
}
