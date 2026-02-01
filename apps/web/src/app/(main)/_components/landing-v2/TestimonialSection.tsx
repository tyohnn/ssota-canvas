"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/ui/card";
import { motion } from "framer-motion";
import { Section } from "./Section";

const testimonials = [
  {
    quote: "Chat wouldn't give me the big picture. SSOTA organized my chaos into a strategy immediately.",
    author: "Sarah J.",
    role: "Product Strategy Lead",
    initials: "SJ",
  },
  {
    quote: "I used to restart research every time. Now my board keeps growing. It's a second brain that actually works.",
    author: "David K.",
    role: "Venture Capital Analyst",
    initials: "DK",
  },
  {
    quote: "The templates are a game changer. I dropped 5 PDFs and got a structured consulting report structure in seconds.",
    author: "Elena R.",
    role: "Management Consultant",
    initials: "ER",
  },
];

export function TestimonialSection() {
  return (
    <Section className="bg-muted/30 py-20" id="testimonials">
      <div className="flex flex-col items-center mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Trusted by heavy thinkers.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="h-full border-none shadow-md bg-background/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                  <AvatarFallback>{t.initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{t.author}</span>
                  <span className="text-xs text-muted-foreground">{t.role}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">"{t.quote}"</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
