"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section } from "./Section";
import { MagneticDotsBackground } from "./MagneticDotsBackground";

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
  return (
    <Section className="bg-background relative">
      {/* Magnetic Dot pattern background */}
      <MagneticDotsBackground />
      <div className="relative z-10 flex flex-col justify-center items-center text-center max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-primary/10">
            <span aria-hidden>👋</span>
            Hey, ambitious
          </span>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Not another AI summarizer,<br />
          <span className="text-primary">AI Canvas for Research</span>
        </motion.h1>

        <motion.div
          className="space-y-4 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            Drop your sources—links, videos, PDFs, audio—on one canvas.
            <br />
            SSOTA’s AI agent turns them into a structured canvas, <br />so you can reach a plan, make a decision, and make your next big move.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button asChild size="lg">
            {isLoggedIn ? (
              <Link href="/r">Start your big thing</Link>
            ) : (
              <Link href="/login">
                Start your big thing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </Button>
        </motion.div>
      </div>
    </Section>
  );
}
