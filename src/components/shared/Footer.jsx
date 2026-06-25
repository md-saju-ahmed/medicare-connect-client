"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Asterisk, HeartPulse } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "@/components/shared/Container";

const quickLinks = [
  {
    label: "Find Doctors",
    href: "/doctors",
  },
  {
    label: "Patient Support",
    href: "/support",
  },
  {
    label: "Healthcare Careers",
    href: "/careers",
  },
  {
    label: "Press Kit",
    href: "/press",
  },
];

const legalLinks = [
  {
    label: "Privacy Policy",
    href: "/privacy-policy",
  },
  {
    label: "Terms of Service",
    href: "/terms",
  },
  {
    label: "Cookie Settings",
    href: "/cookies",
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    icon: FaFacebookF,
  },
  {
    label: "Twitter",
    href: "#",
    icon: FaXTwitter,
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: FaLinkedinIn,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ y: 80 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
      }}
      className="bg-secondary pt-20 pb-10"
    >
      <Container>
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 transition-colors group-hover:bg-white/20">
                <HeartPulse className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl text-white">
                <span className="font-bold">MediCare</span> Connect
              </span>
            </Link>

            <p className="max-w-sm text-base leading-relaxed text-white/80 mb-6">
              Redefining the healthcare experience through human-centric design
              and expert medical care.
            </p>

            <div className="space-y-2 text-white/80">
              <p className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <span className="font-medium text-white/60">Email:</span>
                <a
                  href="mailto:contact@medicare.com"
                  className="hover:underline"
                >
                  contact@medicare.com
                </a>
              </p>

              <p className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <span className="font-medium text-white/60">Phone:</span>
                <a href="tel:+8801712345678" className="hover:underline">
                  +880 1712-345678
                </a>
              </p>

              <p className="flex items-start gap-2 text-sm">
                <span className="font-medium text-white/60 pt-0.5">
                  Address:
                </span>
                <span className="max-w-50 leading-relaxed">
                  Banani, Dhaka 1213
                  <br />
                  Bangladesh
                </span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="mb-6 font-bold text-white" id="quick-links-heading">
              Quick Links
            </h4>
            <nav aria-labelledby="quick-links-heading">
              <ul className="space-y-3">
                {quickLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/70 transition-all duration-200 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-2">
            <h4 className="mb-6 font-bold text-white" id="legal-links-heading">
              Legal
            </h4>
            <nav aria-labelledby="legal-links-heading">
              <ul className="space-y-3">
                {legalLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/70 transition-all duration-200 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Emergency Contact */}
          <div className="lg:col-span-4">
            <Card className="rounded-3xl bg-[#0b2013] p-8 border border-white/10 h-full">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Asterisk
                    className="h-6 w-6"
                    strokeWidth={3}
                    style={{ color: "#ba1a1a" }}
                    aria-hidden="true"
                  />
                  Emergency Hotline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <a
                  href="tel:1-800-633-4357"
                  className="block text-2xl font-bold text-white hover:text-accent"
                  aria-label="Call emergency hotline: 1-800-MED-HELP"
                >
                  1-800-MED-HELP
                </a>
                <p className="text-sm text-white/70">
                  Available 24/7 for immediate medical assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="bg-white/10 mb-8" />
        <div className="flex flex-col items-center justify-between gap-6 text-sm text-white/60 md:flex-row">
          <p>&copy; {currentYear} MediCare Connect. All rights reserved.</p>

          <div className="flex items-center gap-4">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${item.label}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              );
            })}
          </div>
        </div>
      </Container>
    </motion.footer>
  );
}
