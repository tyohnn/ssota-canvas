import type { Tutorial } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { Box } from '@workspace/ui/components/ui/box';
import { MockCanvas } from '@/domains/tutorial-management/frontend/components/mock-canvas';
import { useTutorialDialogContext } from '@/domains/tutorial-management/frontend/components/tutorial-dialog/core/context';

/**
 * Getting Started tutorial content component
 */
function GettingStartedContent() {
  const { currentTutorial } = useTutorialDialogContext();

  return (
    <Box className="h-full w-full flex flex-col">
      <MockCanvas
        initialNodes={currentTutorial?.content.initialNodes}
        initialEdges={currentTutorial?.content.initialEdges}
      />
    </Box>
  );
}

export const gettingStartedTutorial: Tutorial = {
  id: 'getting-started',
  name: 'Getting Started',
  description: 'A quick overview of SSOTA and its main features',
  category: 'getting-started',
  status: 'available',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'add-block',
      title: 'Add Your First Block',
      description: 'Click the Note button to add a markdown block to your canvas.',
      targetSelector: 'block-type-markdown',
      action: 'click',
      onComplete: (state) => ({
        ...state,
        blockCreationMode: true,
        selectedBlockType: 'markdown',
      }),
    },
    {
      id: 'place-block',
      title: 'Place Your Block',
      description: 'Click anywhere on the canvas to place your block.',
      action: 'click',
      interactableSelectors: ['canvas-pane'],
      onComplete: (state) => ({
        ...state,
        blockCreationMode: false,
        hasBlock: true,
      }),
    },
    {
      id: 'select-block',
      title: 'Select Your Block',
      description: 'Click on the block you just placed to select it.',
      action: 'click',
      interactableSelectors: ['block-node'],
      onComplete: (state) => ({ ...state, blockSelected: true }),
    },
    {
      id: 'edit-and-type',
      title: 'Edit and Type',
      description:
        'Double-click on the block to enter editing mode, then type some text. The step will advance automatically when you type.',
      action: 'observe',
      interactableSelectors: ['block-node'],
      onComplete: (state) => ({ ...state, hasTypedText: true }),
    },
    {
      id: 'complete',
      title: 'Great Job!',
      description:
        "You've completed the getting started tutorial. You can explore more block types in other tutorials.",
      action: 'observe',
    },
  ],
  content: {
    initialState: {
      hasBlock: false,
      blockCreationMode: false,
      blockSelected: false,
      hasTypedText: false,
    },
    ContentComponent: GettingStartedContent,
    initialNodes: [],
    initialEdges: [],
  },
};
