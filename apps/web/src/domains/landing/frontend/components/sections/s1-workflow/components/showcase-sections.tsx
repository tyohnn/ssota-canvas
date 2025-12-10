/**
 * Showcase Sections Component
 *
 * 모든 showcase sections을 렌더링하는 컴포넌트
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SectionOneContent } from './section-one-content';

export interface ShowcaseSectionsProps {
  section: number;
  subPhase: number;
}

export function ShowcaseSections({ section, subPhase }: ShowcaseSectionsProps) {
  return (
    <div className="w-[30%] flex items-center justify-center p-6 relative">
      <AnimatePresence mode="wait">
        {section === 0 && (
          <SectionOneContent key="section-1" subPhase={subPhase} />
        )}

        {section === 1 && (
          <motion.div
            key="section-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Section 2</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </motion.div>
        )}

        {section === 2 && (
          <motion.div
            key="section-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Section 3</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </motion.div>
        )}

        {section === 3 && (
          <motion.div
            key="section-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Section 4</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </motion.div>
        )}

        {section === 4 && (
          <motion.div
            key="section-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Section 5</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        Section {section + 1} / 5
      </div>
    </div>
  );
}
