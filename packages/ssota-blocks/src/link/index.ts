/**
 * Link Block - ssota-blocks
 *
 * Export View components (for Drive, Landing, Tutorial) and useLinkBlock for Canvas.
 * block-management assembles DataBlock + useLinkBlock + LinkView (Link pattern).
 */

export { LinkView } from './components/link.view';
export { LinkPreviewCard } from './components/link-preview-card';
export {
  LinkEmptyState,
  LinkLoadingState,
} from './components/ui-states';

export { useLinkBlock } from './logic/use-link-block';

export type {
  LinkMetadata,
  LinkPropertiesLike,
  LinkBlockHookProps,
  UseLinkBlockDeps,
  UseLinkBlockReturn,
  LinkViewProps,
} from './logic/types';
