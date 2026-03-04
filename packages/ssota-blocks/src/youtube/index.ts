/**
 * YouTube Block - ssota-blocks
 *
 * Export View components (for Drive, Landing, Tutorial) and useYoutubeBlock for Canvas.
 * block-management assembles DataBlock + useYoutubeBlock + YoutubeView (Link pattern).
 */

export { YoutubeView } from './components/youtube.view';
export { YoutubePreviewCard } from './components/youtube-preview-card';
export { YoutubePlayerOverlay } from './components/youtube-player-overlay';
export {
  YoutubeEmptyState,
  YoutubeErrorState,
  YoutubeLoadingState,
} from './components/ui-states';

export { useYoutubeBlock } from './logic/use-youtube-block';
export { hasYoutubeMetadata } from './logic/types';

export type {
  YoutubeMetadata,
  YoutubePropertiesLike,
  YoutubeBlockHookProps,
  UseYoutubeBlockDeps,
  UseYoutubeBlockReturn,
  YouTubePlayer,
} from './logic/types';
