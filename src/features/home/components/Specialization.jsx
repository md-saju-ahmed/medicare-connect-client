"use client";
import { HeartPulse, Brain, Eye, Bone, Baby } from "lucide-react";
import { motion } from "framer-motion";
import Container from "../../../components/shared/Container";
import SectionTitle from "../../../components/shared/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const specializations = [
  {
    name: "Cardiology",
    icon: HeartPulse,
  },
  {
    name: "Neurology",
    icon: Brain,
  },
  {
    name: "Ophthalmology",
    icon: Eye,
  },
  {
    name: "Orthopedics",
    icon: Bone,
  },
  {
    name: "Pediatrics",
    icon: Baby,
  },
];

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },

  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.4,
    },
  }),
};

const Specialization = () => {
  return (
    <section className="py-20">
      <Container>
        <SectionTitle
          title="Browse by Specialization"
          description="Find the right care across our wide network of experts"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {specializations.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.name}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
              >
                <Link href={`/doctors?specialization=${item.name}`}>
                  <Card className="group border-border rounded-xl cursor-pointer ring-0! p-0 shadow-xs transition-colors hover:bg-primary">
                    <CardContent className="p-5 sm:p-8 text-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center transition group-hover:bg-white/20">
                        <Icon
                          size={30}
                          className="text-primary transition-colors group-hover:text-white"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-white">
                        {item.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default Specialization;
