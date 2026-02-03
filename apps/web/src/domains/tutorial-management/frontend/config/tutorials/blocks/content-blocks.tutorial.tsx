import type { Tutorial } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { Box } from '@workspace/ui/components/ui/box';


export { youtubeBlockTutorial } from '../youtube-block.tutorial';

export const markdownBlockTutorial: Tutorial = {
  id: 'markdown-block',
  name: 'Markdown Block',
  description: 'Create rich text content with markdown formatting',
  category: 'blocks',
  status: 'coming-soon',
  estimatedMinutes: 4,
  steps: [],
  content: {
    initialState: {},
    ContentComponent: () => <Box>Coming soon</Box>,
    initialNodes: [],
    initialEdges: [],
  },
};

export const linkBlockTutorial: Tutorial = {
  id: 'link-block',
  name: 'Link Block',
  description: 'Add web links with automatic preview generation',
  category: 'blocks',
  status: 'coming-soon',
  estimatedMinutes: 3,
  steps: [],
  content: {
    initialState: {},
    ContentComponent: () => <Box>Coming soon</Box>,
    initialNodes: [],
    initialEdges: [],
  },
};
