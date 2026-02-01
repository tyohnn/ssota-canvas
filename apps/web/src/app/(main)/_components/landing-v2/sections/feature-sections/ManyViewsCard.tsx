"use client";

import { motion } from "framer-motion";
import { BentoCard } from "./BentoCard";

export function ManyViewsCard() {
  return (
    <BentoCard
      title="One canvas, many views."
      description="Canvas, table, kanban, timeline—switch views instantly."
      className="md:col-span-1"
      delay={0.3}
      badge="Coming soon"
    >
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="grid grid-cols-2 gap-3 w-full h-full">
          <motion.div
            className="bg-purple-100 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800 p-2 flex flex-col gap-1 shadow-sm"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <div className="text-[10px] font-bold text-purple-800 dark:text-purple-200 uppercase tracking-wider">Canvas</div>
            <div className="flex-1 bg-background rounded-lg border border-purple-200 dark:border-purple-700 relative overflow-hidden">
              <div className="absolute top-2 left-2 w-3 h-3 bg-purple-200 dark:bg-purple-600 rounded-full" />
              <div className="absolute bottom-3 right-3 w-3 h-3 bg-purple-200 dark:bg-purple-600 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-purple-200 dark:bg-purple-600 rotate-45" />
            </div>
          </motion.div>
          <motion.div
            className="bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 p-2 flex flex-col gap-1 shadow-sm"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <div className="text-[10px] font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wider">Kanban</div>
            <div className="flex-1 flex gap-1 items-end pb-1">
              <div className="w-1/3 h-[60%] bg-background rounded-sm border border-blue-200 dark:border-blue-700" />
              <div className="w-1/3 h-[80%] bg-background rounded-sm border border-blue-200 dark:border-blue-700" />
              <div className="w-1/3 h-[40%] bg-background rounded-sm border border-blue-200 dark:border-blue-700" />
            </div>
          </motion.div>
          <motion.div
            className="bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800 p-2 flex flex-col gap-1 shadow-sm"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <div className="text-[10px] font-bold text-green-800 dark:text-green-200 uppercase tracking-wider">Table</div>
            <div className="flex-1 bg-background rounded-lg border border-green-200 dark:border-green-700 flex flex-col gap-1 p-1">
              <div className="w-full h-1.5 bg-green-100 dark:bg-green-800/50 rounded-sm" />
              <div className="w-full h-1.5 bg-green-50 dark:bg-green-900/30 rounded-sm" />
              <div className="w-full h-1.5 bg-green-50 dark:bg-green-900/30 rounded-sm" />
              <div className="w-full h-1.5 bg-green-50 dark:bg-green-900/30 rounded-sm" />
            </div>
          </motion.div>
          <motion.div
            className="bg-orange-100 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800 p-2 flex flex-col gap-1 shadow-sm"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <div className="text-[10px] font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wider">List</div>
            <div className="flex-1 bg-background rounded-lg border border-orange-200 dark:border-orange-700 flex flex-col gap-1.5 p-1.5 justify-center">
              <div className="w-full h-3 bg-orange-50 dark:bg-orange-900/40 rounded-sm border border-orange-200 dark:border-orange-700" />
              <div className="w-full h-3 bg-orange-50 dark:bg-orange-900/40 rounded-sm border border-orange-200 dark:border-orange-700" />
            </div>
          </motion.div>
        </div>
      </div>
    </BentoCard>
  );
}
