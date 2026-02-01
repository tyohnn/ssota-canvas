"use client";

import { useEffect, useState } from "react";

export interface DemoOrchestratorRenderProps {
  step: number;
  /** 데모를 step 0부터 다시 시작 */
  reset: () => void;
  /** reset 시 증가 (key로 사용해 unmount 유도) */
  resetKey: number;
}

export interface DemoOrchestratorProps {
  /**
   * 각 스텝으로 전환되는 시점(ms).
   * [0] = step 0, [1] = step 1 전환 시점, ...
   */
  stepDelaysMs: number[];
  /**
   * 탭별 데모 콘텐츠. step을 받아 탭마다 다른 UI 렌더링.
   */
  children: (props: DemoOrchestratorRenderProps) => React.ReactNode;
  /**
   * false면 step 타이머를 시작하지 않음. 뷰포트 진입 시 true로 전달.
   * @default true
   */
  startWhenReady?: boolean;
}

export function DemoOrchestrator({ stepDelaysMs, children, startWhenReady = true }: DemoOrchestratorProps) {
  const [step, setStep] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!startWhenReady) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    stepDelaysMs.forEach((delay, index) => {
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
  }, [stepDelaysMs, resetKey, startWhenReady]);

  const reset = () => {
    setStep(0);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="relative w-full h-full">
      {children({ step, reset, resetKey })}
    </div>
  );
}
