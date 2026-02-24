import type { Tutorial } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { Box } from '@workspace/ui/components/ui/box';
import { BlockInteractionProvider } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { MockCanvas } from '@/domains/tutorial-management/frontend/components/mock-canvas';
import { MockEditorPanel } from '@/domains/tutorial-management/frontend/components/mock-editor-panel';
import { useTutorialDialogContext } from '@/domains/tutorial-management/frontend/components/tutorial-dialog/core/context';
import { TUTORIAL_YOUTUBE_PROPERTIES } from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';

const PREFILLED_YOUTUBE_URL = TUTORIAL_YOUTUBE_PROPERTIES.url;

/**
 * YouTube Block tutorial content component.
 * Renders MockCanvas and MockEditorPanel when open.
 * BlockInteractionProvider wraps both so script timestamp clicks can seek the block player.
 */
function YoutubeBlockTutorialContent() {
  const { currentTutorial, tutorialState } = useTutorialDialogContext();

  return (
    <Box className="h-full w-full flex flex-col">
      <Box className="flex-1 min-h-0 flex relative">
        <BlockInteractionProvider>
          <MockCanvas
            initialNodes={currentTutorial?.content.initialNodes}
            initialEdges={currentTutorial?.content.initialEdges}
          />
          {/* Same pattern as real app: conditional render + slide animation (no DOM when closed) */}
          <MockEditorPanel
            isVisible={Boolean(tutorialState.editorPanelOpen)}
          />
        </BlockInteractionProvider>
      </Box>
    </Box>
  );
}

export const youtubeBlockTutorial: Tutorial = {
  id: 'youtube-block',
  name: 'YouTube Block',
  description: 'Add YouTube videos, extract transcripts & summaries, and generate visual summaries',
  category: 'blocks',
  status: 'available',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'add-block',
      title: 'Add a YouTube Block',
      description: 'Click the YouTube button to add a YouTube block to your canvas.',
      targetSelector: 'block-type-youtube',
      action: 'click',
      onComplete: (state) => ({
        ...state,
        blockCreationMode: true,
        selectedBlockType: 'youtube',
      }),
    },
    {
      id: 'place-block',
      title: 'Place the Block',
      description: 'Click anywhere on the canvas to place your YouTube block.',
      action: 'click',
      interactableSelectors: ['canvas-pane'],
      onComplete: (state) => ({
        ...state,
        blockCreationMode: false,
        hasBlock: true,
        youtubeUrl: PREFILLED_YOUTUBE_URL,
      }),
    },
    {
      id: 'enter-url',
      title: 'Confirm the URL',
      description:
        'The URL is already filled in. Press Enter to load the video.',
      targetSelector: undefined,
      action: 'input',
      interactableSelectors: ['youtube-url-input'],
      onComplete: (state) => ({ ...state, showPlayer: true }),
    },
    {
      id: 'view-rendered',
      title: 'Video Loaded',
      description: 'The YouTube block is now showing the video preview.',
      targetSelector: 'youtube-block',
      action: 'observe',
    },
    {
      id: 'select-block',
      title: 'Select the Block',
      description: 'Click on the YouTube block to select it.',
      action: 'click',
      interactableSelectors: ['block-node'],
      onComplete: (state) => ({ ...state, blockSelected: true }),
    },
    {
      id: 'open-editor',
      title: 'Open Editor Panel',
      description: 'Click the Details button (chevron) in the toolbar to open the editor panel.',
      targetSelector: 'editor-panel-button',
      action: 'click',
      interactableSelectors: ['editor-panel-button', 'block-node'],
      onComplete: (state) => ({ ...state, editorPanelOpen: true }),
    },
    {
      id: 'click-timeline',
      title: 'Open Timeline Tab',
      description: 'Click the Timeline tab to view the video transcript.',
      targetSelector: 'timeline-tab',
      action: 'click',
      onComplete: (state) => ({ ...state, activeEditorTab: 'timeline' }),
    },
    {
      id: 'click-script-timestamp',
      title: 'Click a Timestamp',
      description: 'Click a timestamp in the transcript (e.g. [0:00]) to jump to that moment in the video.',
      targetSelector: 'script-timestamp',
      action: 'click',
    },
    {
      id: 'click-summary',
      title: 'Open Summary Tab',
      description: 'Click the Summary tab to extract or view the video summary.',
      targetSelector: 'summary-tab',
      action: 'click',
      onComplete: (state) => ({ ...state, activeEditorTab: 'summary' }),
    },
    {
      id: 'click-language',
      title: 'Select Language',
      description: 'Click the language selector to choose a language for the summary.',
      targetSelector: 'language-selector',
      action: 'click',
    },
    {
      id: 'select-english',
      title: 'Choose English',
      description: 'Select English from the language list.',
      targetSelector: 'language-english',
      action: 'click',
      onComplete: (state) => ({ ...state, selectedLanguage: 'en' }),
    },
    {
      id: 'extract-summary',
      title: 'Extract Summary',
      description: 'Click the Summary button to extract the video summary.',
      targetSelector: 'extract-summary-button',
      action: 'click',
      onComplete: (state) => ({ ...state, hasSummary: true }),
    },
    {
      id: 'view-summary',
      title: 'View Summary',
      description: 'The extracted summary is now displayed.',
      targetSelector: 'summary-content',
      action: 'observe',
    },
    {
      id: 'open-visual-summary',
      title: 'Visual Summary',
      description: 'Click the Visual Summary button in the action bar below the block.',
      targetSelector: 'visual-summary-button',
      action: 'click',
      interactableSelectors: ['visual-summary-button'],
      onComplete: (state) => ({ ...state, visualSummaryPopoverOpen: true }),
    },
    {
      id: 'select-template',
      title: 'Choose a Template',
      description: 'Select the second template from the list.',
      targetSelector: 'template-item-2',
      action: 'click',
      interactableSelectors: ['template-item-2', 'block-node'],
      onComplete: (state) => ({
        ...state,
        selectedTemplateId: 'template-2',
        visualSummaryPopoverOpen: false,
        editorPanelOpen: false,
        visualSummaryRendered: true,
      }),
    },
    {
      id: 'view-result',
      title: 'Visual Summary Result',
      description: 'The visual summary has been generated. Great job completing the YouTube block tutorial!',
      targetSelector: 'visual-summary-result',
      action: 'observe',
    },
  ],
  content: {
    initialState: {
      hasBlock: false,
      blockCreationMode: false,
      blockSelected: false,
      editorPanelOpen: false,
      activeEditorTab: 'summary',
      selectedLanguage: 'en',
      hasSummary: false,
      visualSummaryPopoverOpen: false,
      selectedTemplateId: null as string | null,
      visualSummaryRendered: false,
      youtubeUrl: '',
      showPlayer: false,
      lastPlacedNodeId: null as string | null,
    },
    ContentComponent: YoutubeBlockTutorialContent,
    initialNodes: [],
    initialEdges: [],
  },
};
