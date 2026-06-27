"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BriefcaseMedical, DollarSign, Hospital } from "lucide-react";
import Container from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function FeaturedDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/doctors?limit=4&sortBy=rating&order=desc`,
        );

        const data = await res.json();

        setDoctors(data.doctors || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <section className="py-20 bg-muted/30">
      <Container>
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Featured Doctors
          </h2>
          <p className="text-muted-foreground mt-3">
            Consult with experienced and verified healthcare professionals
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-7">
          {loading &&
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-105 rounded-2xl bg-muted animate-pulse"
              />
            ))}

          {!loading &&
            doctors.map((doctor, index) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full overflow-hidden rounded-2xl border-border bg-card p-0 ring-0 gap-0 group shadow-xs hover:shadow-sm transition-all flex flex-col">
                  {/* Image */}
                  <div className="relative">
                    <AspectRatio ratio={4 / 3}>
                      <Image
                        src={doctor.profileImage}
                        alt={doctor.doctorName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </AspectRatio>

                    {/* specialization badge */}
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                      {doctor.specialization}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold">{doctor.doctorName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {doctor.qualifications}
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BriefcaseMedical size={16} className="text-primary" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hospital size={16} className="text-primary" />
                        <span className="truncate">{doctor.hospitalName}</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Consultation
                        </p>
                        <p className="text-lg font-bold flex items-center mt-0.5">
                          <DollarSign size={18} className="shrink-0" />{" "}
                          {doctor.consultationFee}
                        </p>
                      </div>
                      <Link href={`/doctors/${doctor._id}`} className="flex-1">
                        <Button className="w-full">Book Now</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </Container>
    </section>
  );
}
