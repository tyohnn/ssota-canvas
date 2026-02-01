"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Grip, Kanban, List, Table, MoreHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { useState, useEffect } from "react";
import { ColorToken, COLOR_CLASSES } from "./shared";

const tasks = [
  {
    id: 1,
    title: "Market Research",
    status: "To Do",
    color: ColorToken.RED,
    initialX: 100,
    initialY: 100,
    initialRotate: -5,
  },
  {
    id: 2,
    title: "Competitor Analysis",
    status: "To Do",
    color: ColorToken.BLUE,
    initialX: 250,
    initialY: 50,
    initialRotate: 3,
  },
  {
    id: 3,
    title: "User Interviews",
    status: "In Progress",
    color: ColorToken.GREEN,
    initialX: 150,
    initialY: 200,
    initialRotate: -2,
  },
  {
    id: 4,
    title: "Draft Strategy",
    status: "In Progress",
    color: ColorToken.AMBER,
    initialX: 350,
    initialY: 150,
    initialRotate: 4,
  },
  {
    id: 5,
    title: "Final Review",
    status: "Done",
    color: ColorToken.PURPLE,
    initialX: 450,
    initialY: 80,
    initialRotate: -3,
  },
];

const VIEWS = ["canvas", "board", "table", "list"] as const;
const STEP_DELAYS = [0, 1500, 3500, 5500]; // canvas -> board -> table -> list
export const ORGANIZE_COMPLETION_DELAY_MS = 6000; // 6 seconds after mount
const TOTAL_STEPS = VIEWS.length;

interface OrganizeTabProps {
  onTabComplete?: () => void;
  /** 뷰포트 진입 시 true. false면 step 애니메이션 대기 */
  startAnimation?: boolean;
}

export function OrganizeTab({ onTabComplete, startAnimation = true }: OrganizeTabProps) {
  const [step, setStep] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const view = VIEWS[step] ?? "list";

  const reset = () => {
    setStep(0);
    setResetKey((k) => k + 1);
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_DELAYS.forEach((delay, index) => {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setStep(index);
        }, delay);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [resetKey]);

  // Call onTabComplete after delay
  useEffect(() => {
    if (!startAnimation) return;

    const completionTimer = setTimeout(() => {
      onTabComplete?.();
    }, ORGANIZE_COMPLETION_DELAY_MS);

    return () => {
      clearTimeout(completionTimer);
    };
  }, [onTabComplete, resetKey, startAnimation]);

  const isComplete = step >= TOTAL_STEPS - 1;

  return (
    <motion.div
      className="relative w-full h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Reset button: same position as SummarizeTab/StructureTab (top-3 right-3 of container) */}
      <div className="absolute top-[-15px] right-3 z-10 pointer-events-auto">
        {!isComplete ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background/90 backdrop-blur-sm shadow-sm"
            onClick={reset}
          >
            <span
              className="h-2 w-2 rounded-full bg-green-500 shrink-0"
              style={{ animation: "live-demo-pulse 1.5s ease-in-out infinite" }}
            />
            Live demo
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-background/90 backdrop-blur-sm shadow-sm"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reload
          </Button>
        )}
      </div>

      <style>
        {`
          @keyframes live-demo-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.8; }
          }
        `}
      </style>

      <div className="flex-1 flex flex-col p-4 min-h-0">
        <div className="flex justify-end gap-2 mb-6">
          <Button
            variant={view === "canvas" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setStep(0)}
          >
            <Grip className="h-4 w-4" /> Canvas
          </Button>
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setStep(1)}
          >
            <Kanban className="h-4 w-4" /> Board
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setStep(2)}
          >
            <Table className="h-4 w-4" /> Table
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setStep(3)}
          >
            <List className="h-4 w-4" /> List
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            {view === "canvas" && (
              <motion.div
                key="canvas"
                className="w-full h-full relative bg-muted/20 dark:bg-muted/40 rounded-2xl border border-border overflow-hidden shadow-inner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="absolute inset-0 z-0 opacity-30"
                  style={{
                    backgroundImage: "radial-gradient(#888 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {tasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    layoutId={`task-${task.id}`}
                    className={`absolute p-3 rounded-lg shadow-sm border text-sm font-medium w-48 flex items-center justify-center text-center cursor-grab active:cursor-grabbing ${COLOR_CLASSES[task.color]}`}
                    initial={{ scale: 0 }}
                    animate={{
                      x: task.initialX,
                      y: task.initialY,
                      rotate: task.initialRotate,
                      scale: 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: i * 0.1,
                    }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  >
                    {task.title}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {view === "board" && (
              <motion.div
                key="board"
                className="flex gap-6 h-full overflow-x-auto p-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {["To Do", "In Progress", "Done"].map((status) => (
                  <div
                    key={status}
                    className="w-72 shrink-0 bg-secondary/30 dark:bg-secondary/20 rounded-lg border border-border p-3 h-full"
                  >
                    <div className="font-medium text-sm mb-3 flex justify-between items-center">
                      {status}
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-3 relative h-full">
                      {tasks
                        .filter((t) => t.status === status)
                        .map((task) => (
                          <motion.div
                            key={task.id}
                            layoutId={`task-${task.id}`}
                            className={`p-3 rounded-lg shadow-sm border text-sm font-medium ${COLOR_CLASSES[task.color]}`}
                          >
                            {task.title}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {view === "table" && (
              <motion.div
                key="table"
                className="w-full h-full border border-border rounded-lg overflow-hidden bg-background"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-4 bg-muted/50 dark:bg-muted/30 p-3 text-xs font-semibold text-muted-foreground border-b border-border">
                  <div className="col-span-2">Task Name</div>
                  <div>Status</div>
                  <div>Assignee</div>
                </div>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-4 p-3 text-sm border-b border-border hover:bg-muted/20 dark:hover:bg-muted/30 items-center text-foreground"
                  >
                    <div className="col-span-2 font-medium flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${COLOR_CLASSES[task.color].split(" ")[0]}`}
                      />
                      {task.title}
                    </div>
                    <div>
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs text-secondary-foreground">
                        {task.status}
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-background" />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {view === "list" && (
              <motion.div
                key="list"
                className="w-full h-full space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-background dark:bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow text-foreground"
                    layoutId={`task-list-${task.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-1 h-8 rounded-full ${COLOR_CLASSES[task.color].split(" ")[0]}`}
                      />
                      <span className="font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                      <span>{task.status}</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
