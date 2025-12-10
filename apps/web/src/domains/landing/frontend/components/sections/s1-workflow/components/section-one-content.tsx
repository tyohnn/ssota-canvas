/**
 * Section One Content Component
 *
 * Section 1 (Software Development) 좌측 콘텐츠
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PhaseDescription } from './phase-description';
import { PhaseIndicators } from './phase-indicators';
import { SectionBadge } from './section-badge';
import { SECTION1_PHASES, type PhaseData } from '../data/section1-phases';

export interface SectionOneContentProps {
  subPhase: number;
}

export function SectionOneContent({ subPhase }: SectionOneContentProps) {
  // subPhase 0: intro만, 1~4: actual phases (Plan, Design, Develop, Deploy)
  const isIntro = subPhase === 0;
  const actualPhaseIndex = Math.max(0, subPhase - 1);
  const currentPhase = SECTION1_PHASES[actualPhaseIndex] ?? SECTION1_PHASES[0]!;

  return (
    <div className="space-y-4 max-w-xl">
      {/* Main heading - 항상 표시, 리렌더링 안됨 */}
      <motion.div
        animate={{
          y: isIntro ? 0 : -40,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Heading - 첫 번째 등장 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-bold leading-tight"
        >
          ONE CANVAS WHERE
          <br />
          YOUR WORK LIVES
        </motion.h1>

        {/* Subtext - 두 번째 등장 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-base text-muted-foreground leading-relaxed mt-4"
        >
          From Plan, Research, Design to Make, Create, Develop on limitless
          canvas with collaborating AI
        </motion.p>
      </motion.div>

      {/* Spacer */}
      <div className="pt-8" />

      {/* Badge + Phase description - subPhase 1부터 표시 */}
      {!isIntro && (
        <div className="space-y-4">
          {/* Badge - 한번만 등장, 유지 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <SectionBadge
              icon="🚀"
              label="For Software Development"
              variant="primary"
            />
          </motion.div>

          {/* Phase description - 텍스트만 변경 (AnimatePresence로 전환) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`phase-desc-${actualPhaseIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PhaseDescription
                title={currentPhase.title}
                description={currentPhase.description}
                subPhase={actualPhaseIndex}
              />
            </motion.div>
          </AnimatePresence>

          {/* Phase indicators - 그대로 유지, state만 변경 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            <PhaseIndicators
              totalPhases={SECTION1_PHASES.length}
              currentPhase={actualPhaseIndex}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
