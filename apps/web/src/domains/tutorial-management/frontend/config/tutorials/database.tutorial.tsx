import type { Tutorial } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { PlaceholderTutorialContent } from './placeholder-content';

const placeholderSteps = [
  {
    id: 'placeholder',
    title: 'Coming soon',
    description: 'This tutorial will be available in a future update.',
    action: 'observe' as const,
  },
];

export const addViewsTutorial: Tutorial = {
  id: 'add-views',
  name: 'Add views',
  description: 'Learn how to add views to your database.',
  category: 'database',
  status: 'coming-soon',
  estimatedMinutes: 5,
  steps: placeholderSteps,
  content: {
    initialState: {},
    ContentComponent: PlaceholderTutorialContent,
    initialNodes: [],
    initialEdges: [],
  },
};
