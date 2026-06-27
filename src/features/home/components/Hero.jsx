"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Link from "next/link";

const patients = [
  "/images/patient-1.png",
  "/images/patient-2.png",
  "/images/patient-3.png",
];

export default function Hero() {
  return (
    <section className="pt-8 pb-14 px-5 sm:pt-10 sm:pb-16 sm:px-8 md:pt-12 md:pb-20 md:px-10 max-w-7xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-5 md:space-y-8"
        >
          {/* Trust Badge */}
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-full text-xs"
          >
            <BadgeCheck size={16} className="shrink-0" />
            Trusted by 10,000+ Patients
          </Badge>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-xl">
            Healthcare, <span className="text-primary italic">Simplified</span>{" "}
            for your Life.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
            Experience a nurturing approach to wellness. Connect with
            world-class specialists and manage your health journey in one
            organic, easy-to-use platform.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-2 sm:pt-4">
            <Button
              size="lg"
              className="h-12 sm:h-14 rounded-xl px-6 sm:px-8 gap-2 shadow-lg shadow-primary/10 text-sm sm:text-base"
              asChild
            >
              <Link href="/doctors">
                Find a Doctor
                <ArrowRight size={16} className="shrink-0" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 sm:h-14 rounded-xl px-6 sm:px-8 border-primary/20 text-primary text-sm sm:text-base"
            >
              How it Works
            </Button>
          </div>

          {/* Patient Avatars */}
          <div className="flex items-center gap-4 sm:gap-6 pt-2 sm:pt-4">
            <div className="flex -space-x-3 shrink-0">
              {patients.map((patient, index) => (
                <Avatar
                  key={index}
                  className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-white"
                >
                  <AvatarImage src={patient} alt="Patient" />
                </Avatar>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Joined by{" "}
              <span className="font-bold text-foreground">
                500+ Top Doctors
              </span>{" "}
              this month
            </p>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative isolate mt-4 md:mt-0"
        >
          {/* Decorative Blobs */}
          <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 bg-primary/20 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-pulse z-0 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-accent/30 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] z-0 pointer-events-none" />

          <Card className="relative z-10 p-3 sm:p-4 rounded-[24px] sm:rounded-[32px] overflow-hidden border-0! ring-0! shadow-none bg-white max-w-130 mx-auto md:mx-0">
            <AspectRatio ratio={520 / 500}>
              <Image
                src="/images/doctor-patient.png"
                alt="Doctor consulting patient"
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 520px"
                className="object-cover rounded-[18px] sm:rounded-[24px]"
              />
            </AspectRatio>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
