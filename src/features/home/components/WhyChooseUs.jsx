"use client";
import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, CalendarCheck, Headset } from "lucide-react";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Records",
    description:
      "Your health data is encrypted and managed with the highest privacy standards.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Doctors",
    description:
      "Every professional on our platform goes through a rigorous credential check.",
  },
  {
    icon: CalendarCheck,
    title: "Instant Booking",
    description:
      "No more waiting on hold. Schedule your appointments in just a few clicks.",
  },
  {
    icon: Headset,
    title: "24/7 Support",
    description:
      "Our concierge team is always here to help you navigate your care journey.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionTitle
          title="A Better Way to Health"
          description="We combine cutting-edge technology with human empathy to deliver a healthcare experience that feels as natural as it is effective."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                }}
              >
                <Card className="group relative h-full p-0 overflow-hidden border-border/60 ring-0 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lg">
                  <CardContent className="p-8 space-y-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary/10 bg-primary/5 text-primary shadow-xs">
                      <Icon size={25} />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
