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

function makeEditorPanelTutorial(
  id: string,
  name: string,
  description: string,
  status: 'available' | 'coming-soon' = 'coming-soon'
): Tutorial {
  return {
    id,
    name,
    description,
    category: 'editor-panel',
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

export const basicEditorPanelTutorial = makeEditorPanelTutorial(
  'basic-editor-panel',
  'Basic editor panel',
  'Learn the basics of the editor panel.'
);

export const addCustomPropertyTutorial = makeEditorPanelTutorial(
  'add-custom-property',
  'Add custom property',
  'Learn how to add custom properties to blocks.'
);
