"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Globe2,
  HeartHandshake,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import PlatformStats from "../home/components/PlatformStats";

const values = [
  {
    title: "Trust & Security",
    description:
      "Your medical records are protected with advanced encryption and strict privacy protocols.",
    icon: LockKeyhole,
    number: "01",
  },
  {
    title: "Accessibility",
    description:
      "Breaking geographic and financial barriers to bring quality healthcare everywhere.",
    icon: Globe2,
    number: "02",
  },
  {
    title: "Compassionate Care",
    description:
      "Behind every interaction is a human story. We prioritize empathy in every experience.",
    icon: HeartHandshake,
    number: "03",
  },
  {
    title: "Innovation",
    description:
      "Using modern technology and intelligent systems to improve healthcare delivery.",
    icon: Lightbulb,
    number: "04",
  },
];

const team = [
  {
    name: "Dr. Sarah Mitchell",
    role: "CEO & Founder",
    image: "/images/sarah.png",
    description:
      "A former surgeon passionate about integrating technology into modern healthcare.",
  },
  {
    name: "Marcus Chen",
    role: "Chief Technology Officer",
    image: "/images/marcus.png",
    description:
      "Leading our privacy architecture and healthcare technology infrastructure.",
  },
  {
    name: "Elena Rodriguez",
    role: "Head of Patient Experience",
    image: "/images/elena.png",
    description:
      "Ensuring every patient interaction feels personal and supportive.",
  },
];

const missionHighlights = [
  "One connected platform for discovering, managing, and accessing healthcare.",
  "Expert medical guidance available anytime, anywhere — no barriers.",
  "Privacy-first architecture with end-to-end patient data protection.",
  "Bridging the gap between specialists and patients across geographies.",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1.0] },
  },
};

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-background text-foreground antialiased">
      {/* Hero */}
      <section className="relative py-20">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-6"
            >
              <div className="text-sm font-semibold uppercase tracking-widest text-primary">
                Our Identity
              </div>
              <SectionTitle title="About MediCare Connect" align="left" />
              <p className="text-lg leading-relaxed text-muted-foreground">
                Empowering individuals through seamless healthcare
                accessibility. We connect patients and providers through
                compassion and modern technology.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  variant="default"
                  asChild
                  size="lg"
                  className="h-14 px-8"
                >
                  <Link href="#mission">Our Vision</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  size="lg"
                  className="h-14 px-8"
                >
                  <Link href="#team">Meet The Team</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative w-full"
            >
              {/* decorative border */}
              <div
                aria-hidden
                className="absolute -bottom-3 -right-3 h-full w-full rounded-3xl border-2 border-primary/20"
              />
              <div className="relative overflow-hidden rounded-3xl border border-border/50 shadow-2xl">
                <AspectRatio ratio={4 / 3}>
                  <Image
                    src="/images/healthcare-team.png"
                    alt="Healthcare professionals"
                    fill
                    priority
                    className="object-cover object-center"
                  />
                </AspectRatio>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section
        id="mission"
        className="border-y border-border/40 bg-muted/30 py-20 lg:py-28"
      >
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-xl"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <SectionTitle
                title="Why we digitize healthcare access"
                align="left"
              />
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                <p>
                  MediCare Connect was born from a simple realization:
                  healthcare journeys are often fragmented and complicated. We
                  built one connected platform where patients can discover,
                  manage, and access care easily.
                </p>
                <p>
                  Our mission is to make expert medical guidance accessible
                  anytime, anywhere — regardless of geography or income.
                </p>
              </div>
            </motion.div>

            {/* Right */}
            <div className="space-y-3">
              {missionHighlights.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="flex items-start gap-4 rounded-2xl border border-border/50 bg-background p-5 shadow-xs transition-shadow duration-200 hover:shadow-sm"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 md:text-base">
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28">
        <Container>
          <SectionTitle
            eyebrow="Our Values"
            title="The pillars of our care"
            description="Nurturing trust through transparency, compassion, and innovation."
            align="center"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                >
                  <Card className="group relative h-full p-0 overflow-hidden border-border/60 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lg">
                    <CardContent className="relative p-6 md:p-7">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mb-2 text-base font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Statistics */}
      <PlatformStats />

      {/* Team */}
      <section id="team" className="py-20 lg:py-28">
        <Container>
          <SectionTitle
            eyebrow="The Visionaries"
            title="Leading the transition to digital health"
            description="Our leadership team combines healthcare expertise with technology-driven innovation."
            align="center"
          />

          <div className="mt-12 grid gap-7 md:grid-cols-3 lg:mt-16">
            {team.map((member, index) => (
              <motion.article
                key={member.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="group overflow-hidden border-border/60 p-0 ring-0! shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="relative w-full overflow-hidden bg-muted">
                    <AspectRatio ratio={4 / 3}>
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover object-center transition duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/15 to-transparent" />
                    </AspectRatio>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold tracking-tight">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-20 lg:pb-28">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl"
          >
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-xl md:px-20 md:py-20">
              <div className="relative">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                  Get Started Today
                </span>
                <h2 className="mx-auto mt-2 max-w-2xl text-2xl font-bold tracking-tight text-primary-foreground md:text-4xl lg:text-5xl">
                  Ready to take control of your healthcare?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/70">
                  Join thousands of patients who have found trusted healthcare
                  professionals through our platform.
                </p>
                <Button
                  size="lg"
                  asChild
                  className="mt-8 h-12 rounded-full bg-primary-foreground px-8 font-semibold text-primary shadow-md transition-transform hover:scale-[1.02] hover:bg-primary-foreground/90"
                >
                  <Link
                    href="/doctors"
                    className="inline-flex items-center gap-2"
                  >
                    Find A Doctor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
  );
}
