"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Container from "@/components/shared/Container";

export default function PlatformStats() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/stats/public`,
        );

        const data = await res.json();

        setStats(data.stats);
      } catch (error) {
        console.log(error);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
      {/* Wave Background */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            d="M0,50 Q25,0 50,50 T100,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <path
            d="M0,70 Q25,20 50,70 T100,70"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <Container>
        <div className="relative z-10 grid grid-cols-2 gap-10 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
              className="text-center"
            >
              <h3 className="text-4xl font-bold tracking-tight md:text-5xl">
                {stat.value}
              </h3>
              <p className="mt-2 text-sm font-medium md:text-base text-primary-foreground/80">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
