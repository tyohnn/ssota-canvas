"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { BentoCard } from "./BentoCard";

export function ChatBoardsCard() {
  return (
    <BentoCard
      title="Chat disappears. Canvas stay."
      description="Keep research on a canvas you can revisit and extend."
      className="md:col-span-1"
      delay={0.1}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Chat fading away - Left side (triggers on card hover via group-hover) */}
        <div
          className="absolute left-[10%] top-1/2 -translate-y-1/2 p-4 bg-muted rounded-xl w-64 opacity-50 shadow-sm border border-border transition-all duration-500 group-hover:opacity-0 group-hover:-translate-x-[50px]"
        >
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div className="h-2.5 w-24 bg-muted-foreground/20 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full bg-muted-foreground/15 rounded" />
            <div className="h-2.5 w-5/6 bg-muted-foreground/15 rounded" />
            <div className="h-2.5 w-4/6 bg-muted-foreground/15 rounded" />
          </div>
        </div>

        {/* Board persisting - Right side (Larger) */}
        <motion.div
          className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[55%] h-[80%] bg-background border border-border rounded-xl shadow-xl p-4 z-10"
          initial={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="grid grid-cols-3 gap-3 h-full">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 col-span-1" />
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 col-span-2" />
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 col-span-2" />
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 col-span-1" />
          </div>
        </motion.div>
      </div>
    </BentoCard>
  );
}
