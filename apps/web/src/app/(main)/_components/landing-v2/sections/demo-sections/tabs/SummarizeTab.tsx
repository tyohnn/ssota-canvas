"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { DemoOrchestrator } from "../DemoOrchestrator";
import { MockEditorPanel } from "./summarize/editor/MockEditorPanel";
import { SummarizeReactFlow } from "./summarize/SummarizeReactFlow";
import { useEffect } from "react";

/** Summarize Tab - step 타이밍 상수 (ms) */
const SUMMARIZE_STEP_CONFIG = {
  /** step 0 종료 후 step 1 진입까지 대기 */
  START_OFFSET: 400,
  /** 각 step 간 고정 간격 (클릭 후 다음 스텝까지 여유) */
  INTERVAL_MS: 2400,
} as const;

const STEP_COUNT = 7; // step 0 ~ 6

/** step 0: fitToView, 1: 블록선택, 2: Extract하이라이트, 3: 팝오버, 4: 패널+로딩, 5: 완료, 6: 스크롤 */
export const SUMMARIZE_STEP_DELAYS_MS = Array.from(
  { length: STEP_COUNT },
  (_, i) => (i === 0 ? 0 : SUMMARIZE_STEP_CONFIG.START_OFFSET + (i - 1) * SUMMARIZE_STEP_CONFIG.INTERVAL_MS)
);

export interface SummarizeTabProps {
  onTabComplete?: () => void;
  /** 뷰포트 진입 시 true. false면 step 애니메이션 대기 */
  startAnimation?: boolean;
}

/**
 * Summarize Tab Content - wrapper component to use hooks properly
 */
function SummarizeTabContent({
  step,
  reset,
  resetKey,
  onTabComplete,
}: {
  step: number;
  reset: () => void;
  resetKey: number;
  onTabComplete?: () => void;
}) {
  // Call onTabComplete when reaching last step
  useEffect(() => {
    if (step === SUMMARIZE_STEP_DELAYS_MS.length - 1) {
      onTabComplete?.();
    }
  }, [step, onTabComplete]);

  return (
    <>
      <SummarizeReactFlow step={step} />
      {step >= 4 && (
        <MockEditorPanel key={resetKey} isOpen step={step} />
      )}

      <div className="absolute top-3 right-3 z-10 pointer-events-auto">
        {step < SUMMARIZE_STEP_DELAYS_MS.length - 1 ? (
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
    </>
  );
}

/**
 * Summarize Tab
 *
 * Extract Summary 플로우 전용 데모.
 */
export function SummarizeTab({ onTabComplete, startAnimation = true }: SummarizeTabProps) {
  return (
    <DemoOrchestrator stepDelaysMs={SUMMARIZE_STEP_DELAYS_MS} startWhenReady={startAnimation}>
      {({ step, reset, resetKey }) => (
        <SummarizeTabContent
          step={step}
          reset={reset}
          resetKey={resetKey}
          onTabComplete={onTabComplete}
        />
      )}
    </DemoOrchestrator>
  );
}
