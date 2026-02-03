import type { Tutorial } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { ReactFlowProvider } from '@xyflow/react';
import { Box } from '@workspace/ui/components/ui/box';
import { MockYoutubeBlock } from '@/domains/tutorial-management/frontend/components/mock-youtube-block';

/**
 * YouTube Block tutorial content component.
 * Wrapped in ReactFlowProvider so Handle (HandlesView) inside MockYoutubeBlock has zustand context.
 */
function YoutubeBlockTutorialContent() {
  return (
    <ReactFlowProvider>
      <Box className="h-full w-full flex items-center justify-center bg-muted/30">
        <MockYoutubeBlock />
      </Box>
    </ReactFlowProvider>
  );
}

export const youtubeBlockTutorial: Tutorial = {
  id: 'youtube-block',
  name: 'YouTube Block',
  description: 'Add YouTube videos and extract transcripts & summaries',
  category: 'blocks',
  status: 'available',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'paste-url',
      title: 'Paste YouTube URL',
      description: 'Paste a YouTube video URL in the input field. Try: https://youtube.com/watch?v=dQw4w9WgXcQ',
      targetSelector: 'youtube-url-input',
      action: 'input',
    },
    {
      id: 'add-video',
      title: 'Add the Video',
      description: 'Click "Add Video" to load the YouTube player.',
      targetSelector: 'youtube-url-input',
      action: 'click',
      onComplete: (state) => ({
        ...state,
        youtubeUrl: state.youtubeUrl || 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        showPlayer: true,
      }),
    },
    {
      id: 'view-player',
      title: 'Video Added!',
      description: 'Great! The YouTube video has been added to your block. In the real app, you can view transcripts, summaries, and more.',
      targetSelector: 'youtube-player',
      action: 'observe',
    },
  ],
  content: {
    initialState: {
      youtubeUrl: '',
      showPlayer: false,
    },
    ContentComponent: YoutubeBlockTutorialContent,
    initialNodes: [],
    initialEdges: [],
  },
};

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
