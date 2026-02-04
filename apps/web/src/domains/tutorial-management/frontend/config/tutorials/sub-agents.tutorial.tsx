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

function makeSubAgentTutorial(
  id: string,
  name: string,
  description: string,
  status: 'available' | 'coming-soon' = 'coming-soon'
): Tutorial {
  return {
    id,
    name,
    description,
    category: 'sub-agents',
    status,
    estimatedMinutes: 5,
    steps: placeholderSteps,
    content: {
      initialState: {},
      ContentComponent: PlaceholderTutorialContent,
      initialNodes: [],
      initialEdges: [],
    },
  };
}

export const createSubAgentTutorial = makeSubAgentTutorial(
  'create-sub-agent',
  'Create sub agent',
  'Learn how to create a sub agent.'
);

export const createSkillsTutorial = makeSubAgentTutorial(
  'create-skills',
  'Create skills',
  'Learn how to create skills for your agents.'
);
