/**
 * Status Window Panel
 *
 * 우측 상단 패널: Status Window + 닫힌 경우 다시 열기 트리거 버튼
 * Status 창: 제자리에서 너비 확장 + 블러 해제 (슬라이드 없음)
 * 버튼↔윈도우 전환 간격 최소화
 */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity } from 'lucide-react';

import { useAIActionContext } from '../contexts/ai-action-context';
import { StatusWindow } from './status-window';
import { Box } from '@/components/ui/box';

// 버튼: 전환만 빠르게 (간격 최소화)
const buttonTransition = { type: 'tween' as const, duration: 0.1 };

// Status 창 열릴 때: 너비 확장 + 블러 해제 (제자리), 퓨쳐리틱 이징
const windowOpenTransition = {
  type: 'tween' as const,
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const, // easeOutExpo
};

// Status 창 닫힐 때: 제자리에서 너비 수축 + 블러 (같은 이징, 약간 더 짧게)
const windowCloseTransition = {
  type: 'tween' as const,
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as const,
};

export function StatusWindowPanel() {
  const { windowDismissed, showStatusWindow, dismissStatusWindow } =
    useAIActionContext();
  const [isExiting, setIsExiting] = useState(false);

  const showWindow = !windowDismissed || isExiting;

  const handleCloseAnimationComplete = () => {
    if (isExiting) {
      dismissStatusWindow();
      setIsExiting(false);
    }
  };

  return (
    <Box className="flex flex-col items-end">
      <AnimatePresence mode="wait">
        {!showWindow ? (
          <motion.div
            key="trigger"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={buttonTransition}
            className="flex flex-col items-end"
          >
            <button
              type="button"
              onClick={showStatusWindow}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Open status window"
            >
              <Activity className="h-4 w-4" />
              Status
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="window"
            initial={{
              opacity: 0,
              width: 0,
              filter: 'blur(12px)',
            }}
            animate={
              isExiting
                ? {
                    opacity: 0,
                    width: 0,
                    filter: 'blur(12px)',
                  }
                : {
                    opacity: 1,
                    width: 320,
                    filter: 'blur(0px)',
                  }
            }
            transition={
              isExiting ? windowCloseTransition : windowOpenTransition
            }
            onAnimationComplete={handleCloseAnimationComplete}
            className="overflow-hidden origin-right"
          >
            <StatusWindow onDismiss={() => setIsExiting(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
