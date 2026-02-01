"use client";

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/ui/tabs";
import { motion } from "framer-motion";
import { Section } from "../../Section";
import { CanvasDemo } from "./CanvasDemo";
import { useState, useEffect, useRef, useCallback } from "react";
import { SUMMARIZE_STEP_DELAYS_MS } from "./tabs/SummarizeTab";
import { STRUCTURE_STEP_DELAYS_MS } from "./tabs/StructureTab";
import { ORGANIZE_COMPLETION_DELAY_MS } from "./tabs/OrganizeTab";
import { DELIVERABLES_COMPLETION_DELAY_MS } from "./tabs/DeliverablesTab";

const VIEWPORT_ENTER_THRESHOLD = 0.2; // 20% 보이면 시작

const TAB_ORDER = ["summarize", "structure", "organize", "deliverables"] as const;

// Total duration for each tab in milliseconds
// Calculated from actual stepDelaysMs: last step delay = total duration
const TAB_DURATIONS_MS: Record<typeof TAB_ORDER[number], number> = {
  summarize: SUMMARIZE_STEP_DELAYS_MS[SUMMARIZE_STEP_DELAYS_MS.length - 1] || 0,
  structure: STRUCTURE_STEP_DELAYS_MS[STRUCTURE_STEP_DELAYS_MS.length - 1] || 0,
  organize: ORGANIZE_COMPLETION_DELAY_MS,
  deliverables: DELIVERABLES_COMPLETION_DELAY_MS,
};

export function DemoSection() {
  const [activeTab, setActiveTab] = useState("summarize");
  const [currentTabProgress, setCurrentTabProgress] = useState(0); // 0-1 for current tab only
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tabStartTimeRef = useRef<number>(Date.now());
  const totalDurationRef = useRef<number>(0);

  // 뷰포트에 들어오면 애니메이션 시작 (한 번 true면 유지)
  const hasFiredRef = useRef(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !hasFiredRef.current) {
          hasFiredRef.current = true;
          setHasEnteredViewport(true);
        }
      },
      { threshold: VIEWPORT_ENTER_THRESHOLD }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Start progress animation when tab changes - completely independent of steps
  useEffect(() => {
    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const totalDurationMs = TAB_DURATIONS_MS[activeTab as typeof TAB_ORDER[number]] || 0;
    totalDurationRef.current = totalDurationMs;

    if (totalDurationMs > 0) {
      tabStartTimeRef.current = Date.now();
      setCurrentTabProgress(0);

      // Use requestAnimationFrame for smooth, continuous progress
      const animate = () => {
        const elapsed = Date.now() - tabStartTimeRef.current;
        const progress = Math.min(elapsed / totalDurationMs, 1);
        setCurrentTabProgress(progress);

        // Continue animation if not complete
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeTab, hasEnteredViewport]);

  const handleTabComplete = useCallback(() => {
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Current tab finished → show 100%, no auto-advance to next tab
    setCurrentTabProgress(1);
  }, []);

  // When user manually clicks a tab, reset progress to 0
  const handleTabChange = useCallback((value: string) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCurrentTabProgress(0);
    setActiveTab(value);
  }, []);

  // Each tab: 0% → 100%. When tab ends = 100%, next tab starts at 0%
  const progressPercent = currentTabProgress * 100;

  return (
    <Section className="bg-muted/30 dark:bg-muted/30 py-20" id="demo">
      <div ref={sectionRef} className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col items-center mb-12 space-y-4 text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-medium border border-primary/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span>Interactive demo</span>
            <span className="text-muted-foreground">·</span>
            <span>Click & scroll to explore</span>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Try SSOTA in 30 seconds.
          </motion.h2>
        </div>

        <Tabs
          defaultValue="summarize"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-7xl mx-auto px-4 md:px-6 h-[70vh] flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="summarize" className="text-base">Summarize</TabsTrigger>
            <TabsTrigger value="structure" className="text-base">Structure</TabsTrigger>
            <TabsTrigger value="organize" className="text-base">Organize</TabsTrigger>
            <TabsTrigger value="deliverables" className="text-base">Deliverables</TabsTrigger>
          </TabsList>

          <div className="flex-1 relative border rounded-xl overflow-hidden shadow-lg bg-background">
            {/* Progress indicator: smooth, continuous animation independent of steps */}
            <div className="absolute top-0 left-0 right-0 h-0.5 z-50 bg-muted/30 dark:bg-muted/30">
              <div
                className="h-full bg-primary rounded-b"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <CanvasDemo
              mode={activeTab}
              onTabComplete={handleTabComplete}
              startAnimation={hasEnteredViewport}
            />
          </div>
        </Tabs>
      </div>
    </Section>
  );
}
