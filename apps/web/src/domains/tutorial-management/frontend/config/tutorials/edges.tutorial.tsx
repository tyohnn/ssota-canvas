import type { Tutorial } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { Box } from '@workspace/ui/components/ui/box';

export const edgesTutorial: Tutorial = {
  id: 'connecting-blocks',
  name: 'Connecting Blocks',
  description: 'Learn how to connect blocks with edges to show relationships',
  category: 'edges',
  status: 'coming-soon',
  estimatedMinutes: 4,
  steps: [],
  content: {
    initialState: {},
    ContentComponent: () => <Box>Coming soon</Box>,
  },
};