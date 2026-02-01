"use client";

import { motion } from "framer-motion";
import { FileVideo, Presentation, FileCode, ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { useEffect } from "react";

const items = [
  {
    id: "video",
    title: "Demo_Recording.mp4",
    type: "Video",
    icon: <FileVideo className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
    color:
      "border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100",
    delay: 0.1,
  },
  {
    id: "ppt",
    title: "Q3_Strategy_Deck.pptx",
    type: "Presentation",
    icon: <Presentation className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
    color:
      "border-orange-200 dark:border-orange-800 bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100",
    delay: 0.2,
  },
  {
    id: "code",
    title: "analytics_config.ts",
    type: "Code",
    icon: <FileCode className="h-5 w-5 text-purple-500 dark:text-purple-400" />,
    color:
      "border-purple-200 dark:border-purple-800 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100",
    delay: 0.3,
  },
];

export const DELIVERABLES_COMPLETION_DELAY_MS = 4000; // 4 seconds after mount

interface DeliverablesTabProps {
  onTabComplete?: () => void;
  /** 뷰포트 진입 시 true. false면 애니메이션 대기 */
  startAnimation?: boolean;
}

export function DeliverablesTab({ onTabComplete, startAnimation = true }: DeliverablesTabProps) {
  // Call onTabComplete after delay
  useEffect(() => {
    if (!startAnimation) return;

    const completionTimer = setTimeout(() => {
      onTabComplete?.();
    }, DELIVERABLES_COMPLETION_DELAY_MS);

    return () => {
      clearTimeout(completionTimer);
    };
  }, [onTabComplete, startAnimation]);

  return (
    <motion.div
      className="w-full h-full p-4 relative flex items-center justify-center bg-muted/20 dark:bg-muted/40 rounded-2xl border border-border overflow-hidden shadow-inner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 z-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col justify-center">
        <div className="relative flex flex-col gap-0">
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border dark:bg-muted-foreground/30 rounded-full" />

          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className="relative flex items-start gap-6 py-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: item.delay,
              }}
            >
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-background shadow-sm">
                {item.icon}
              </div>

              <motion.div
                className={`flex-1 min-w-0 max-w-sm p-4 rounded-xl border-2 shadow-sm ${item.color} backdrop-blur-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{item.type}</span>
                </div>
                <div className="bg-background/50 dark:bg-foreground/5 rounded p-2 space-y-1.5">
                  <div className="h-1.5 w-3/4 bg-current opacity-10 rounded" />
                  <div className="h-1.5 w-1/2 bg-current opacity-10 rounded" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="absolute bottom-8 right-8 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button className="shadow-lg gap-2">
            <ArrowRight className="h-4 w-4" /> Export All
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
