"use client";

import { motion } from "framer-motion";
import { Code, Cpu, FileText, Image as ImageIcon } from "lucide-react";
import { BentoCard } from "./BentoCard";

export function ResearchToPlanCard() {
  return (
    <BentoCard
      title="From research to work."
      description="Turn the canvas into next-step work: code, slides, images, even circuits."
      className="md:col-span-2"
      delay={0.4}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-between px-16">
          {/* Source */}
          <motion.div
            className="w-24 h-32 bg-muted border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="w-12 h-1 bg-muted-foreground/20 rounded" />
            <div className="w-8 h-1 bg-muted-foreground/20 rounded" />
          </motion.div>

          {/* Process Arrow */}
          <div className="flex-1 flex justify-center relative">
            <motion.div
              className="h-1 w-full rounded-full opacity-50 bg-linear-to-r from-muted via-primary to-muted"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-2 rounded-full border border-border shadow-sm"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Cpu className="h-5 w-5 text-primary" />
            </motion.div>
          </div>

          {/* Outputs */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Code</span>
            </motion.div>
            <motion.div
              className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <div className="w-6 h-4 border-2 border-orange-500 dark:border-orange-400 rounded-sm" />
              <span className="text-[10px] font-medium text-orange-700 dark:text-orange-300">Slide</span>
            </motion.div>
            <motion.div
              className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <ImageIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300">Image</span>
            </motion.div>
            <motion.div
              className="w-16 h-16 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm"
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <Cpu className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-[10px] font-medium text-green-700 dark:text-green-300">Logic</span>
            </motion.div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
