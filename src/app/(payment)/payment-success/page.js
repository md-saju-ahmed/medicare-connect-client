"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  CalendarDays,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Container from "@/components/shared/Container";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.2 },
  },
};

function PaymentLoadingFallback() {
  return (
    <Container className="min-h-screen flex items-center justify-center py-10">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-none bg-transparent ring-0">
          <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-foreground font-medium">
                Confirming your payment…
              </p>
              <p className="text-sm text-muted-foreground">
                Please don&apos;t close this page
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState(appointmentId ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState(
    appointmentId ? "" : "No appointment ID found in URL.",
  );
  const [appointment, setAppointment] = useState(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!appointmentId) return;
    if (calledRef.current) return;
    calledRef.current = true;

    const recordPayment = async () => {
      try {
        const { data: jwtData } = await authClient.token();
        const token = jwtData?.token;

        if (!token) throw new Error("Not authenticated");

        const apptRes = await fetch(
          `${API_BASE}/api/appointments/${appointmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!apptRes.ok) {
          const errBody = await apptRes.json().catch(() => ({}));
          throw new Error(
            errBody.message ||
              `Failed to fetch appointment details (${apptRes.status})`,
          );
        }

        const apptJson = await apptRes.json();
        const apptData = apptJson?.data ?? apptJson?.appointment ?? apptJson;

        let enrichedApptData = apptData;
        if (apptData?.doctorId && !apptData?.doctorName) {
          try {
            const doctorRes = await fetch(
              `${API_BASE}/api/doctors/${apptData.doctorId}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (doctorRes.ok) {
              const doctorData = await doctorRes.json();
              enrichedApptData = {
                ...apptData,
                doctorName: doctorData?.doctorName,
              };
            }
          } catch (doctorErr) {
            console.warn("Failed to fetch doctor name:", doctorErr);
          }
        }

        setAppointment(enrichedApptData);

        const amount = enrichedApptData.consultationFee ?? 150;

        const payRes = await fetch(`${API_BASE}/api/payments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentId,
            amount: Number(amount),
            sessionId,
          }),
        });

        if (!payRes.ok && payRes.status !== 400) {
          const errData = await payRes.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to record payment");
        }

        setStatus("success");
      } catch (err) {
        console.error("Payment recording error:", err);
        setErrorMessage(err.message || "Something went wrong");
        setStatus("error");
      }
    };

    recordPayment();
  }, [appointmentId]);

  if (status === "loading") {
    return <PaymentLoadingFallback />;
  }

  if (status === "error") {
    return (
      <Container className="min-h-screen flex items-center justify-center py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="w-full max-w-md"
        >
          <Card className="border-destructive/20 shadow-xs relative overflow-hidden ring-0 p-8">
            <CardHeader className="text-center pb-4">
              <motion.div
                variants={iconVariants}
                className="mx-auto bg-destructive/10 rounded-full p-4 mb-4"
              >
                <XCircle className="h-10 w-10 text-destructive" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">
                Payment Recording Failed
              </CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert
                variant="destructive"
                className="bg-destructive/5 border-destructive/20 text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Notice</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  If your card was charged, please contact support with your
                  appointment ID: <br />
                  <span className="font-mono font-bold mt-1 block">
                    {appointmentId || "N/A"}
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex-col gap-3 bg-white">
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard/appointments">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  View My Appointments
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                <Link href="/">Back to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen flex items-center justify-center py-15">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 shadow-xs relative overflow-hidden ring-0 p-8">
          <CardHeader className="text-center p-0">
            <motion.div
              variants={iconVariants}
              className="mx-auto bg-primary/10 rounded-full p-4 mb-4"
            >
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              Payment Successful!
            </CardTitle>
            <CardDescription>
              Your appointment has been confirmed and payment recorded.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {appointment ? (
              <div className="bg-muted rounded-xl p-5 space-y-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Receipt Details
                </p>
                <div className="space-y-3 text-sm text-foreground">
                  {appointment.doctorName && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Doctor</span>
                      <span className="font-medium">
                        Dr. {appointment.doctorName}
                      </span>
                    </div>
                  )}
                  {appointment.appointmentDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {new Date(
                          appointment.appointmentDate,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {appointment.appointmentTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">
                        {appointment.appointmentTime}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-bold text-primary text-base">
                      ${appointment.consultationFee ?? 150}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 bg-muted rounded-xl animate-pulse" />
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Appointment ID:{" "}
                <span className="font-mono">{appointmentId}</span>
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3 py-8 px-0 bg-white">
            <Button asChild className="w-full group" size="lg">
              <Link href="/dashboard/appointments">
                <CalendarDays className="mr-2 h-4 w-4" />
                View My Appointments
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/doctors">Book Another Appointment</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </Container>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
