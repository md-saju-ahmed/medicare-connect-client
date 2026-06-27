"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, AlertCircle } from "lucide-react";
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

export default function PaymentCancelledPage() {
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

  return (
    <Container className="min-h-screen flex items-center justify-center py-15">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="w-full max-w-md"
      >
        <Card className="border-amber-500/20 shadow-xs relative overflow-hidden ring-0 p-8">
          <CardHeader className="text-center p-0">
            <motion.div
              variants={iconVariants}
              className="mx-auto bg-amber-500/10 rounded-full p-4 mb-4"
            >
              <XCircle className="h-12 w-12 text-amber-500" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              Payment Cancelled
            </CardTitle>
            <CardDescription className="mt-2">
              You cancelled the payment. Your appointment is still saved but
              remains{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-500">
                unpaid
              </span>
              .
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 text-amber-600! dark:text-amber-500!" />
              <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">
                What happens next?
              </AlertTitle>
              <AlertDescription>
                <ul className="space-y-1.5 mt-2 list-disc list-inside text-xs">
                  <li>Your appointment slot is still held</li>
                  <li>You can pay anytime from your appointments page</li>
                  <li>No charge was made to your card</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="bg-white flex-col gap-3 py-8 px-0">
            <Button
              asChild
              className="w-full bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
              size="lg"
            >
              <Link href="/dashboard/appointments">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Payment Again
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
