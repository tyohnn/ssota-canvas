/**
 * Phase Description Component
 *
 * Phase 정보(title, description)를 표시하는 UI 컴포넌트
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface PhaseDescriptionProps {
  title: string;
  description: string;
  subPhase: number;
}

export function PhaseDescription({
  title,
  description,
  subPhase,
}: PhaseDescriptionProps) {
  return (
    <div className="pt-3 space-y-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={`phase-${subPhase}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
          <p className="text-base text-muted-foreground">{description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
