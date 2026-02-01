"use client";

import { motion } from "framer-motion";
import { Bot, FileText, Sparkles, Zap } from "lucide-react";
import { BentoCard } from "./BentoCard";

// Round to 4 decimals so server and client produce identical transform strings (avoids hydration mismatch)
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function AgentBoardCard() {
  const skills = [
    { icon: <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />, color: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800", angle: 0 },
    { icon: <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />, color: "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800", angle: 120 },
    { icon: <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />, color: "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800", angle: 240 },
  ];

  return (
    <BentoCard
      title="The agent works on your board."
      description="Sub-agents, skills, and actions working together."
      className="md:col-span-2"
      delay={0.2}
      badge="Coming soon"
    >
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full h-full flex gap-8">
          {/* Left: Mini canvas preview */}
          <motion.div
            className="w-[45%] h-full bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 p-4 flex flex-col gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your board</div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800" />
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800" />
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 col-span-2" />
            </div>
          </motion.div>

          {/* Right: Central Agent + Orbiting Skills + Skill list */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Central Agent */}
            <motion.div
              className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center border-4 border-background shadow-lg z-10"
              whileHover={{ scale: 1.08 }}
            >
              <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </motion.div>

            {/* Orbiting Skills */}
            {skills.map((skill, i) => {
              const rad = (a: number) => (a * Math.PI) / 180;
              const x0 = round4(Math.cos(rad(skill.angle)) * 100);
              const y0 = round4(Math.sin(rad(skill.angle)) * 100);
              const x1 = round4(Math.cos(rad(skill.angle + 120)) * 100);
              const y1 = round4(Math.sin(rad(skill.angle + 120)) * 100);
              const x2 = round4(Math.cos(rad(skill.angle + 240)) * 100);
              const y2 = round4(Math.sin(rad(skill.angle + 240)) * 100);
              return (
                <motion.div
                  key={i}
                  className={`absolute left-1/2 top-1/2 w-14 h-14 ${skill.color} rounded-full flex items-center justify-center border-2 border-background shadow-sm -translate-x-1/2 -translate-y-1/2`}
                  style={{ x: x0, y: y0 }}
                  animate={{
                    rotate: 360,
                    x: [x0, x1, x2, x0],
                    y: [y0, y1, y2, y0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  {skill.icon}
                </motion.div>
              );
            })}

            {/* Skill labels below */}
            <div className="mt-24 flex gap-4 flex-wrap justify-center">
              {["Summarize", "Structure", "Export", "Ask"].map((label, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-muted/80 text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
