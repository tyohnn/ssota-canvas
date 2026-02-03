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

function makeBlockAdvanceTutorial(
  id: string,
  name: string,
  description: string,
  status: 'available' | 'coming-soon' = 'available'
): Tutorial {
  return {
    id,
    name,
    description,
    category: 'block-advance',
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

export const addBlockMethodTutorial = makeBlockAdvanceTutorial(
  'add-block-method',
  'Various ways to add blocks',
  'Learn different ways to add blocks to your canvas.',
  'coming-soon'
);

export const duplicateBlockTutorial = makeBlockAdvanceTutorial(
  'duplicate-block',
  'Duplicate block',
  'Learn how to duplicate blocks.',
  'coming-soon'
);

export const groupBlocksTutorial = makeBlockAdvanceTutorial(
  'group-blocks',
  'Group blocks',
  'Learn how to group blocks.',
  'coming-soon'
);

export const deleteBlocksTutorial = makeBlockAdvanceTutorial(
  'delete-blocks',
  'Delete blocks',
  'Learn how to delete blocks.',
  'coming-soon'
);
