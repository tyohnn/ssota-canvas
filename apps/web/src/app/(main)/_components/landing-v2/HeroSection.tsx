"use client";

import { motion } from "framer-motion";
import { Section } from "./Section";
import { MagneticDotsBackground } from "./MagneticDotsBackground";
import { DemoSection } from "./sections/demo-sections/DemoSection";

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn: _isLoggedIn = false }: HeroSectionProps) {
  return (
    <Section className="bg-background relative justify-start items-start">
      {/* Magnetic Dot pattern background */}
      <MagneticDotsBackground />
      <div className="relative z-10 flex flex-col w-full">
        {/* Hero copy + CTA */}
        <div className="flex flex-col justify-center items-start text-left w-full space-y-6 pt-12 pb-4">
          <motion.h1
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Built to make your research extraordinarily productive.
            <br />
            <span className="text-primary">SSOTA is the best way to research with AI.</span>
          </motion.h1>
        </div>

        {/* Demo right below hero — no x padding here; padding on tab parent in DemoSection */}
        <div className="w-full flex flex-col items-start pb-20">
          <DemoSection embeddedInHero />
        </div>
      </div>
    </Section>
  );
}
