/**
 * Intro Content Component
 *
 * 첫 화면 중앙 배치 콘텐츠
 */

'use client';

import { motion } from 'framer-motion';

export function IntroContent() {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-6 max-w-2xl mx-auto"
    >
      {/* Main heading */}
      <h1 className="text-5xl font-bold leading-tight">
        ONE CANVAS WHERE
        <br />
        YOUR WORK
        <br />
        LIVES
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed">
        From Plan, Research, Design to Make, Create, Develop on limitless canvas
        with collaborating AI
      </p>
    </motion.div>
  );
}

