"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section } from "./Section";
import { MagneticDotsBackground } from "./MagneticDotsBackground";

interface CTASectionProps {
  isLoggedIn?: boolean;
}

export function CTASection({ isLoggedIn = false }: CTASectionProps) {
  return (
    <Section className="bg-background relative" id="cta">
      <MagneticDotsBackground />
      <div className="relative z-10 flex flex-col justify-center items-center text-center max-w-4xl mx-auto space-y-8">
        <motion.h2
          className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Structure your research.
          <br />
          <span className="text-primary">Build the next big thing.</span>
        </motion.h2>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
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
