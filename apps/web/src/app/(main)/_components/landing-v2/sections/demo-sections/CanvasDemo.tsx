"use client";

import { AnimatePresence } from "framer-motion";
import {
  SummarizeTab,
  StructureTab,
  OrganizeTab,
  DeliverablesTab,
} from "./tabs";

interface CanvasDemoProps {
  mode: string;
  onTabComplete?: () => void;
  /** 뷰포트 진입 시 true. false면 탭별 step 애니메이션 대기 */
  startAnimation?: boolean;
}

export function CanvasDemo({ mode, onTabComplete, startAnimation = true }: CanvasDemoProps) {
  const isFullCanvas = mode === "summarize" || mode === "structure";

  return (
    <div
      className={`w-full h-full relative overflow-hidden ${isFullCanvas ? "" : "bg-dot-pattern p-8"
        }`}
    >
      <AnimatePresence mode="wait">
        {mode === "summarize" && (
          <SummarizeTab
            key="summarize"
            onTabComplete={onTabComplete}
            startAnimation={startAnimation}
          />
        )}
        {mode === "structure" && (
          <StructureTab
            key="structure"
            onTabComplete={onTabComplete}
            startAnimation={startAnimation}
          />
        )}
        {mode === "organize" && (
          <OrganizeTab
            key="organize"
            onTabComplete={onTabComplete}
            startAnimation={startAnimation}
          />
        )}
        {mode === "deliverables" && (
          <DeliverablesTab
            key="deliverables"
            onTabComplete={onTabComplete}
            startAnimation={startAnimation}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
