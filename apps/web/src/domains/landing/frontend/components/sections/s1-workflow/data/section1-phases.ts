/**
 * Section 1 Phase Descriptions
 *
 * Software Development 섹션의 Phase 데이터
 */

export interface PhaseData {
  title: string;
  description: string;
}

export const SECTION1_PHASES: PhaseData[] = [
  {
    title: 'Plan',
    description: 'Transform meeting recordings into structured specs',
  },
  {
    title: 'Design',
    description: 'Visualize every component state in one place',
  },
  {
    title: 'Develop',
    description: 'Code, commit, review - all connected',
  },
  {
    title: 'Deploy',
    description: 'From canvas to production in seconds',
  },
];

