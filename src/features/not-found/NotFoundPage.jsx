"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Container from "@/components/shared/Container";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <Container>
        <section className="relative z-10 flex flex-col items-center text-center py-12">
          {/* Illustration */}
          <motion.div
            className="relative mb-6 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 md:h-80 md:w-80"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
          >
            <motion.div
              animate={{
                y: [0, -12, 0],
                rotate: [0, 1, -1, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-full"
            >
              <Image
                src="/images/404-illustration.png"
                alt="Page not found illustration"
                width={320}
                height={320}
                priority
                className="h-full w-full object-contain drop-shadow-xl"
              />
            </motion.div>
          </motion.div>

          {/* Error Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: "easeOut",
            }}
            className="w-full"
          >
            <h1 className="text-[100px] font-semibold leading-none tracking-tighter text-primary/10 md:text-[140px]">
              404
            </h1>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Oops! Page not found
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist, may have been
              moved, or the link might be incorrect. Let&apos;s get you back on
              track.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.6,
              ease: "easeOut",
            }}
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button
              asChild
              size="lg"
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/">
                <Home className="mr-1 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg border-border text-primary hover:bg-accent hover:text-accent-foreground"
            >
              <Link href="/contact">
                Contact Support
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </section>
      </Container>
    </main>
  );
}
