"use client";

import { cn } from "@workspace/ui/lib/utils";
import { motion } from "framer-motion";

export interface BentoCardProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
  badge?: string;
}

export function BentoCard({
  title,
  description,
  className,
  children,
  delay = 0,
  badge,
}: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.01 }}
    >
      {badge && (
        <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          {badge}
        </div>
      )}
      {/* Bottom blur layer - always visible on mobile (no hover), hover-only on desktop for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[5] h-1/3 bg-background/70 dark:bg-background/80 backdrop-blur-sm pointer-events-none opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="mt-auto">
          <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Background/Visual Content - always fully visible, scale animates on hover */}
      <div className="absolute inset-0 z-0 opacity-100">
        {children}
      </div>
    </motion.div>
  );
}
