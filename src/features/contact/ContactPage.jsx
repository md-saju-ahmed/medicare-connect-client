"use client";
import { motion } from "framer-motion";
import { Mail, SendHorizonal, User, Tag, MessageSquare } from "lucide-react";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <Container>
        <SectionTitle
          title="Get in Touch"
          description="Have a question, feedback, or a project in mind? We'd love to hear from you. This contact form is for demonstration purposes only."
        />

        {/* Form */}
        <div className="mt-10 flex justify-center">
          <motion.div
            custom={0.1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="w-full max-w-3xl"
          >
            <Card className="overflow-hidden rounded-3xl border border-slate-200 ring-0!">
              <CardContent className="p-6 md:p-8">
                <form className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Full Name</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="h-12 pl-10 bg-muted/10"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          className="h-12 pl-10 bg-muted/10"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Subject</label>
                    <div className="relative">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-12 pl-10 bg-muted/10"
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Message</label>
                    <div className="relative">
                      <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        className="h-44 resize-none pl-10 pt-3 bg-muted/10"
                        placeholder="Write your message here..."
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button variant="default" className="h-14 w-full gap-2">
                    Send Message
                    <SendHorizonal className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
